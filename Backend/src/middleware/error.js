const multer = require("multer");
const mongoose = require("mongoose");
const env = require("../config/env");

const notFound = (req, res) => {
  res.status(404).json({ message: `Route introuvable : ${req.method} ${req.originalUrl}` });
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  let status = err.status || err.statusCode || 500;
  let message = err.message || "Erreur serveur.";
  let { details } = err;

  if (err instanceof multer.MulterError) {
    status = 400;
    message =
      err.code === "LIMIT_FILE_SIZE" ? "Image trop lourde (5 Mo maximum)." : `Erreur d'envoi : ${err.message}`;
  } else if (err instanceof mongoose.Error.CastError) {
    status = 400;
    message = "Identifiant invalide.";
  } else if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
    message = "Données invalides.";
    details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  } else if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || {})[0];
    const labels = { email: "Cet email est déjà utilisé.", name: "Ce nom existe déjà.", slug: "Ce nom existe déjà." };
    message = labels[field] || "Cette valeur existe déjà.";
  } else if (err.type === "entity.parse.failed") {
    status = 400;
    message = "JSON invalide.";
  }

  if (status >= 500) {
    console.error(err);
    if (env.isProd) message = "Erreur serveur.";
  }

  res.status(status).json({ message, ...(details ? { details } : {}) });
};

module.exports = { notFound, errorHandler };
