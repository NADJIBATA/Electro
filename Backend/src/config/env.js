const path = require("path");

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({ path: path.join(__dirname, "../../.env"), quiet: true });
}

const toInt = (value, fallback) => {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
};

const NODE_ENV = process.env.NODE_ENV || "development";
const isProd = NODE_ENV === "production";
const isTest = NODE_ENV === "test";

const env = {
  NODE_ENV,
  isProd,
  isTest,
  PORT: toInt(process.env.PORT, 3000),
  // Nombre de proxys devant l'API (Render = 1 ; Vercel + Render = 2) pour retrouver la vraie IP client
  TRUST_PROXY: toInt(process.env.TRUST_PROXY, 1),
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/electro",

  // URL publique du front (liens dans les emails, retours de paiement)
  CLIENT_URL: (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, ""),
  // URL publique de l'API (webhook Chargily). Laisse vide si le front fait proxy vers l'API.
  API_PUBLIC_URL: (process.env.API_PUBLIC_URL || "").replace(/\/$/, ""),
  // Origines autorisées en CORS (séparées par des virgules)
  CORS_ORIGINS: (process.env.CORS_ORIGINS || process.env.CLIENT_URL || "http://localhost:5173")
    .split(",")
    .map((o) => o.trim().replace(/\/$/, ""))
    .filter(Boolean),

  JWT_SECRET: process.env.JWT_SECRET || (isProd ? "" : "dev-only-secret-change-me"),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  // "lax" si front et API sont sur le même domaine (proxy Vercel), "none" s'ils sont sur deux domaines
  COOKIE_SAMESITE: process.env.COOKIE_SAMESITE || "lax",

  // Compte admin créé automatiquement au démarrage s'il n'existe aucun admin
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || "",
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || "",

  // Livraison (en dinars)
  SHIPPING_FEE: toInt(process.env.SHIPPING_FEE, 600),
  FREE_SHIPPING_THRESHOLD: toInt(process.env.FREE_SHIPPING_THRESHOLD, 0), // 0 = jamais gratuit

  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "",
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || "",
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || "",
  CLOUDINARY_FOLDER: process.env.CLOUDINARY_FOLDER || "Electro",

  CHARGILY_SECRET_KEY: process.env.CHARGILY_SECRET_KEY || "",
  CHARGILY_MODE: process.env.CHARGILY_MODE === "live" ? "live" : "test",
  // Durée (minutes) avant annulation d'une commande en ligne non payée
  ONLINE_ORDER_TTL_MINUTES: toInt(process.env.ONLINE_ORDER_TTL_MINUTES, 60),

  SMTP_HOST: process.env.SMTP_HOST || "",
  SMTP_PORT: toInt(process.env.SMTP_PORT, 587),
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASS: process.env.SMTP_PASS || "",
  MAIL_FROM: process.env.MAIL_FROM || "Electro <no-reply@electro.local>",
  ADMIN_NOTIFY_EMAIL: process.env.ADMIN_NOTIFY_EMAIL || process.env.ADMIN_EMAIL || "",

  STORE_NAME: process.env.STORE_NAME || "WebStar Electro",
};

env.cloudinaryEnabled = Boolean(
  env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET
);
env.onlinePaymentEnabled = Boolean(env.CHARGILY_SECRET_KEY);
env.mailEnabled = Boolean(env.SMTP_HOST);

if (isProd) {
  const missing = [];
  if (!process.env.MONGODB_URI) missing.push("MONGODB_URI");
  if (!env.JWT_SECRET || env.JWT_SECRET.length < 32) missing.push("JWT_SECRET (32 caractères min.)");
  if (!process.env.CLIENT_URL) missing.push("CLIENT_URL");
  if (missing.length) {
    throw new Error(`Variables d'environnement manquantes en production : ${missing.join(", ")}`);
  }
}

module.exports = env;
