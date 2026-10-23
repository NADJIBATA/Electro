const express = require("express");
const Order = require("../models/Order");
const asyncHandler = require("../utils/asyncHandler");
const chargily = require("../services/chargily");
const orderService = require("../services/orders");

const router = express.Router();

// Webhook Chargily : le corps brut est conservé par express.json (req.rawBody) pour vérifier la signature
router.post(
  "/chargily/webhook",
  asyncHandler(async (req, res) => {
    if (!chargily.verifySignature(req.rawBody, req.get("signature"))) {
      return res.status(403).json({ message: "Signature invalide." });
    }
    const event = req.body || {};
    const checkout = event.data || {};
    const orderId = checkout.metadata?.orderId;

    const order =
      (checkout.id && (await Order.findOne({ "payment.checkoutId": checkout.id }))) ||
      (orderId && (await Order.findById(orderId).catch(() => null)));

    if (!order) return res.status(200).json({ received: true, ignored: "commande inconnue" });

    if (event.type === "checkout.paid") {
      if (Number(checkout.amount) < order.total) {
        console.error(`Montant payé insuffisant pour ${order.orderNumber}: ${checkout.amount} < ${order.total}`);
        return res.status(200).json({ received: true, ignored: "montant incorrect" });
      }
      await orderService.applyCheckoutStatus(order, "paid");
    } else if (event.type === "checkout.failed" || event.type === "checkout.canceled") {
      await orderService.applyCheckoutStatus(order, event.type.split(".")[1]);
    }
    return res.status(200).json({ received: true });
  })
);

module.exports = router;
