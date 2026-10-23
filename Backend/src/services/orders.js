const crypto = require("crypto");
const mongoose = require("mongoose");
const env = require("../config/env");
const Order = require("../models/Order");
const Product = require("../models/Product");
const AppError = require("../utils/AppError");
const { findWilaya } = require("../data/wilayas");
const mailer = require("./mailer");
const chargily = require("./chargily");

const computeShipping = (subtotal) =>
  env.FREE_SHIPPING_THRESHOLD > 0 && subtotal >= env.FREE_SHIPPING_THRESHOLD ? 0 : env.SHIPPING_FEE;

const newOrderNumber = () => {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `EL-${ymd}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
};

// Remet en stock les articles d'une commande (une seule fois)
const restoreStock = async (order) => {
  const claimed = await Order.findOneAndUpdate(
    { _id: order._id, stockRestored: false },
    { $set: { stockRestored: true } },
    { new: true }
  );
  if (!claimed) return false;
  await Promise.all(
    claimed.items.map((i) => Product.updateOne({ _id: i.product }, { $inc: { stock: i.quantity } }))
  );
  order.stockRestored = true;
  return true;
};

// Décrémente le stock de façon atomique ; annule tout si un article manque
const reserveStock = async (lines) => {
  const reserved = [];
  for (const line of lines) {
    // eslint-disable-next-line no-await-in-loop
    const res = await Product.updateOne(
      { _id: line.product._id, isActive: true, stock: { $gte: line.quantity } },
      { $inc: { stock: -line.quantity } }
    );
    if (res.modifiedCount !== 1) {
      // eslint-disable-next-line no-await-in-loop
      await Promise.all(reserved.map((r) => Product.updateOne({ _id: r.product._id }, { $inc: { stock: r.quantity } })));
      throw new AppError(`Stock insuffisant pour « ${line.product.name} ».`, 409, [
        { field: "items", productId: line.product._id.toString(), message: "stock insuffisant" },
      ]);
    }
    reserved.push(line);
  }
};

const createOrder = async ({ input, user }) => {
  const wilaya = findWilaya(input.shipping.wilayaCode);
  if (!wilaya) throw new AppError("Wilaya invalide.", 400);

  if (input.paymentMethod === "online" && !env.onlinePaymentEnabled) {
    throw new AppError("Le paiement en ligne n'est pas disponible pour le moment.", 400);
  }

  // Regroupe les doublons du panier
  const quantities = new Map();
  for (const item of input.items) {
    quantities.set(item.productId, (quantities.get(item.productId) || 0) + item.quantity);
  }
  const ids = [...quantities.keys()];
  if (ids.some((id) => !mongoose.isValidObjectId(id))) throw new AppError("Produit invalide dans le panier.", 400);

  const products = await Product.find({ _id: { $in: ids }, isActive: true });
  if (products.length !== ids.length) {
    throw new AppError("Un produit de votre panier n'est plus disponible.", 409);
  }

  // Prix lus en base : on ne fait jamais confiance au prix envoyé par le client
  const lines = products.map((product) => ({ product, quantity: quantities.get(product._id.toString()) }));
  const subtotal = lines.reduce((sum, l) => sum + l.product.price * l.quantity, 0);
  const shippingFee = computeShipping(subtotal);

  await reserveStock(lines);

  let order;
  try {
    order = await Order.create({
      orderNumber: newOrderNumber(),
      user: user?._id || null,
      customer: input.customer,
      shipping: {
        wilayaCode: wilaya.code,
        wilayaName: wilaya.name,
        commune: input.shipping.commune,
        address: input.shipping.address,
        note: input.shipping.note || "",
      },
      items: lines.map((l) => ({
        product: l.product._id,
        name: l.product.name,
        image: l.product.images[0]?.url || "",
        price: l.product.price,
        quantity: l.quantity,
      })),
      subtotal,
      shippingFee,
      total: subtotal + shippingFee,
      paymentMethod: input.paymentMethod,
      paymentStatus: input.paymentMethod === "online" ? "pending" : "unpaid",
      statusHistory: [{ status: "pending", note: "Commande créée" }],
    });
  } catch (err) {
    await Promise.all(lines.map((l) => Product.updateOne({ _id: l.product._id }, { $inc: { stock: l.quantity } })));
    throw err;
  }

  if (order.paymentMethod === "online") {
    try {
      const checkout = await chargily.createCheckout(order);
      order.payment = { provider: "chargily", checkoutId: checkout.id, checkoutUrl: checkout.checkout_url, paidAt: null };
      await order.save();
    } catch (err) {
      await cancelOrder(order, "Échec de création du paiement en ligne", { notify: false });
      throw err;
    }
  } else {
    mailer.notifyNewOrder(order);
  }

  return order;
};

const cancelOrder = async (order, note = "", { notify = true } = {}) => {
  if (order.status === "cancelled") return order;
  if (!Order.TRANSITIONS[order.status].includes("cancelled")) {
    throw new AppError("Cette commande ne peut plus être annulée.", 400);
  }
  order.status = "cancelled";
  order.statusHistory.push({ status: "cancelled", note });
  if (order.paymentStatus === "pending") order.paymentStatus = "failed";
  await order.save();
  await restoreStock(order);
  if (notify) mailer.notifyStatusChange(order);
  return order;
};

const updateStatus = async (order, status, note = "") => {
  if (order.status === status) return order;
  if (!Order.TRANSITIONS[order.status].includes(status)) {
    throw new AppError(`Transition impossible : ${order.status} → ${status}.`, 400);
  }
  if (status === "cancelled") return cancelOrder(order, note);
  if (order.paymentMethod === "online" && order.paymentStatus !== "paid" && status !== "cancelled") {
    throw new AppError("Cette commande en ligne n'est pas encore payée.", 400);
  }
  order.status = status;
  order.statusHistory.push({ status, note });
  if (status === "delivered" && order.paymentMethod === "cod") order.paymentStatus = "paid";
  await order.save();
  mailer.notifyStatusChange(order);
  return order;
};

// Applique le statut d'un checkout Chargily à la commande (webhook ou vérification au retour)
const applyCheckoutStatus = async (order, checkoutStatus) => {
  if (checkoutStatus === "paid") {
    const updated = await Order.findOneAndUpdate(
      { _id: order._id, paymentStatus: { $ne: "paid" } },
      { $set: { paymentStatus: "paid", "payment.paidAt": new Date() } },
      { new: true }
    );
    if (!updated) return order; // déjà traité
    if (updated.status === "cancelled") {
      // Payé après expiration : on garde la trace, l'admin devra rembourser ou réactiver
      console.warn(`Commande ${updated.orderNumber} payée alors qu'elle était annulée.`);
      return updated;
    }
    mailer.notifyNewOrder(updated);
    mailer.notifyPaymentReceived(updated);
    return updated;
  }
  if (["failed", "canceled", "expired"].includes(checkoutStatus) && order.status === "pending") {
    return cancelOrder(order, "Paiement en ligne non abouti", { notify: false });
  }
  return order;
};

// Annule les commandes en ligne restées impayées trop longtemps (libère le stock)
const expireStaleOnlineOrders = async () => {
  const limit = new Date(Date.now() - env.ONLINE_ORDER_TTL_MINUTES * 60 * 1000);
  const stale = await Order.find({
    paymentMethod: "online",
    paymentStatus: "pending",
    status: "pending",
    createdAt: { $lt: limit },
  }).limit(100);
  for (const order of stale) {
    // eslint-disable-next-line no-await-in-loop
    await cancelOrder(order, "Paiement en ligne expiré", { notify: false }).catch(() => {});
  }
  return stale.length;
};

module.exports = {
  createOrder,
  cancelOrder,
  updateStatus,
  applyCheckoutStatus,
  expireStaleOnlineOrders,
  computeShipping,
};
