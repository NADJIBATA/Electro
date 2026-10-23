const env = require("./config/env");
const { connectDB } = require("./config/db");
const createApp = require("./app");
const { ensureAdmin } = require("./services/bootstrap");
const { expireStaleOnlineOrders } = require("./services/orders");

const start = async () => {
  await connectDB();
  await ensureAdmin();

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    console.log(`API Electro démarrée sur le port ${env.PORT} (${env.NODE_ENV})`);
    console.log(
      `Images : ${env.cloudinaryEnabled ? "Cloudinary" : "disque local"} | Paiement en ligne : ${
        env.onlinePaymentEnabled ? `Chargily (${env.CHARGILY_MODE})` : "désactivé"
      } | Emails : ${env.mailEnabled ? "SMTP" : "console"}`
    );
  });

  if (env.isProd && !env.cloudinaryEnabled) {
    console.warn("⚠️  Cloudinary n'est pas configuré : l'ajout de photos échouera en production.");
  }

  // Libère le stock des paiements en ligne abandonnés
  const timer = setInterval(() => {
    expireStaleOnlineOrders()
      .then((n) => n && console.log(`${n} commande(s) en ligne expirée(s) annulée(s).`))
      .catch((err) => console.error("Expiration des commandes :", err.message));
  }, 10 * 60 * 1000);

  const shutdown = (signal) => {
    console.log(`${signal} reçu, arrêt…`);
    clearInterval(timer);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
};

start().catch((err) => {
  console.error("Démarrage impossible :", err);
  process.exit(1);
});
