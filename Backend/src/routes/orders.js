const express = require("express");
const Joi = require("joi");
const rateLimit = require("express-rate-limit");
const env = require("../config/env");
const Order = require("../models/Order");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const validate = require("../middleware/validate");
const { requireAuth } = require("../middleware/auth");
const { phoneSchema } = require("./auth");
const orderService = require("../services/orders");
const chargily = require("../services/chargily");

const router = express.Router();

const orderLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: env.isTest ? 1000 : 15,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Trop de commandes en peu de temps. Réessayez plus tard." },
});

const createSchema = Joi.object({
  customer: Joi.object({
    firstName: Joi.string().trim().min(2).max(60).required(),
    lastName: Joi.string().trim().min(2).max(60).required(),
    phone: phoneSchema.required(),
    email: Joi.string().trim().lowercase().email().allow(""),
  }).required(),
  shipping: Joi.object({
    wilayaCode: Joi.number().integer().min(1).max(69).required(),
    commune: Joi.string().trim().min(2).max(80).required(),
    address: Joi.string().trim().min(5).max(250).required(),
    note: Joi.string().trim().max(500).allow(""),
  }).required(),
  items: Joi.array()
    .items(
      Joi.object({
        productId: Joi.string().hex().length(24).required(),
        quantity: Joi.number().integer().min(1).max(20).required(),
      })
    )
    .min(1)
    .max(30)
    .required(),
  paymentMethod: Joi.string().valid("cod", "online").required(),
});

// Vue publique limitée d'une commande (suivi par numéro + téléphone)
const publicView = (o) => ({
  _id: o._id,
  orderNumber: o.orderNumber,
  status: o.status,
  paymentMethod: o.paymentMethod,
  paymentStatus: o.paymentStatus,
  items: o.items,
  subtotal: o.subtotal,
  shippingFee: o.shippingFee,
  total: o.total,
  shipping: { wilayaCode: o.shipping.wilayaCode, wilayaName: o.shipping.wilayaName, commune: o.shipping.commune },
  statusHistory: o.statusHistory,
  createdAt: o.createdAt,
  checkoutUrl: o.paymentStatus === "pending" && o.status === "pending" ? o.payment?.checkoutUrl || "" : "",
});

const canSee = (req, order) =>
  req.user && (req.user.role === "admin" || (order.user && order.user.equals(req.user._id)));

const normalizePhone = (p) => String(p || "").replace(/\s+/g, "").replace(/^\+213/, "0");

router.post(
  "/",
  orderLimiter,
  validate(createSchema),
  asyncHandler(async (req, res) => {
    const order = await orderService.createOrder({ input: req.body, user: req.user });
    res.status(201).json({ order: publicView(order), checkoutUrl: order.payment?.checkoutUrl || null });
  })
);

router.get(
  "/mine",
  requireAuth,
  asyncHandler(async (req, res) => {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(100);
    res.json(orders.map(publicView));
  })
);

// Suivi sans compte : numéro de commande + téléphone
router.get(
  "/track",
  asyncHandler(async (req, res) => {
    const number = String(req.query.number || "").trim().toUpperCase();
    const phone = normalizePhone(req.query.phone);
    if (!number || !phone) throw new AppError("Numéro de commande et téléphone requis.", 400);
    const order = await Order.findOne({ orderNumber: number });
    if (!order || normalizePhone(order.customer.phone) !== phone) {
      throw new AppError("Aucune commande ne correspond à ces informations.", 404);
    }
    res.json(publicView(order));
  })
);

// Page de retour après paiement : accessible au propriétaire, ou via l'identifiant (non devinable) d'une commande récente
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (!order) throw new AppError("Commande introuvable.", 404);
    const recent = Date.now() - order.createdAt.getTime() < 24 * 60 * 60 * 1000;
    if (!canSee(req, order) && !(recent && !order.user)) throw new AppError("Commande introuvable.", 404);

    // Au retour de Chargily, on vérifie le statut réel du paiement (au cas où le webhook tarde)
    if (order.paymentMethod === "online" && order.paymentStatus === "pending" && order.payment?.checkoutId) {
      try {
        const checkout = await chargily.getCheckout(order.payment.checkoutId);
        const updated = await orderService.applyCheckoutStatus(order, checkout.status);
        return res.json(publicView(updated));
      } catch {
        // on renvoie l'état connu
      }
    }
    return res.json(publicView(order));
  })
);

router.post(
  "/:id/cancel",
  requireAuth,
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (!order || !canSee(req, order)) throw new AppError("Commande introuvable.", 404);
    if (order.status !== "pending") {
      throw new AppError("Seules les commandes en attente peuvent être annulées. Contactez-nous.", 400);
    }
    if (order.paymentStatus === "paid") {
      throw new AppError("Commande déjà payée : contactez-nous pour l'annulation et le remboursement.", 400);
    }
    await orderService.cancelOrder(order, "Annulée par le client");
    res.json(publicView(order));
  })
);

module.exports = router;
module.exports.publicView = publicView;
