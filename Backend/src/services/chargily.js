// Paiement en ligne via Chargily Pay v2 (CIB / Edahabia)
const crypto = require("crypto");
const env = require("../config/env");
const AppError = require("../utils/AppError");

const BASE_URL =
  env.CHARGILY_MODE === "live" ? "https://pay.chargily.net/api/v2" : "https://pay.chargily.net/test/api/v2";

const request = async (method, path, body) => {
  if (!env.onlinePaymentEnabled) throw new AppError("Le paiement en ligne n'est pas activé.", 503);
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${env.CHARGILY_SECRET_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("Chargily", res.status, data);
    throw new AppError("Le service de paiement est indisponible. Réessayez ou choisissez le paiement à la livraison.", 502);
  }
  return data;
};

const createCheckout = (order) => {
  const webhookBase = env.API_PUBLIC_URL || env.CLIENT_URL;
  return request("POST", "/checkouts", {
    amount: order.total,
    currency: "dzd",
    success_url: `${env.CLIENT_URL}/commande/${order._id}?paiement=retour`,
    failure_url: `${env.CLIENT_URL}/commande/${order._id}?paiement=echec`,
    webhook_endpoint: `${webhookBase}/api/payments/chargily/webhook`,
    locale: "fr",
    description: `Commande ${order.orderNumber}`,
    metadata: { orderId: order._id.toString(), orderNumber: order.orderNumber },
  });
};

const getCheckout = (checkoutId) => request("GET", `/checkouts/${encodeURIComponent(checkoutId)}`);

// Vérifie la signature HMAC-SHA256 du corps brut envoyé par Chargily
const verifySignature = (rawBody, signature) => {
  if (!signature || !rawBody || !env.CHARGILY_SECRET_KEY) return false;
  const expected = crypto.createHmac("sha256", env.CHARGILY_SECRET_KEY).update(rawBody).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(String(signature), "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

module.exports = { createCheckout, getCheckout, verifySignature, BASE_URL };
