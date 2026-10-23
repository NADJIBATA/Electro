const express = require("express");
const env = require("../config/env");
const { WILAYAS } = require("../data/wilayas");

const router = express.Router();

router.get("/wilayas", (_req, res) => res.json(WILAYAS));

router.get("/config", (_req, res) =>
  res.json({
    storeName: env.STORE_NAME,
    shippingFee: env.SHIPPING_FEE,
    freeShippingThreshold: env.FREE_SHIPPING_THRESHOLD,
    paymentMethods: { cod: true, online: env.onlinePaymentEnabled },
    onlinePaymentMode: env.onlinePaymentEnabled ? env.CHARGILY_MODE : null,
  })
);

module.exports = router;
