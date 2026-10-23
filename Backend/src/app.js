const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const mongoSanitize = require("express-mongo-sanitize");
const rateLimit = require("express-rate-limit");
const env = require("./config/env");
const { loadUser } = require("./middleware/auth");
const { notFound, errorHandler } = require("./middleware/error");
const { LOCAL_DIR } = require("./services/storage");
const Brand = require("./models/Brand");
const Category = require("./models/Category");
const Joi = require("joi");
const taxonomyRoutes = require("./routes/taxonomy");

const createApp = () => {
  const app = express();
  app.set("trust proxy", env.TRUST_PROXY); // derrière Render (et Vercel)
  app.disable("x-powered-by");

  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(
    cors({
      origin: (origin, cb) => cb(null, !origin || env.CORS_ORIGINS.includes(origin)),
      credentials: true,
    })
  );
  app.use(compression());
  if (!env.isTest) app.use(morgan(env.isProd ? "combined" : "dev"));

  app.use(
    express.json({
      limit: "200kb",
      verify: (req, _res, buf) => {
        req.rawBody = buf; // nécessaire pour vérifier la signature du webhook Chargily
      },
    })
  );
  app.use(express.urlencoded({ extended: true, limit: "200kb" }));
  app.use(cookieParser());
  app.use(mongoSanitize());

  app.use(
    "/api",
    rateLimit({
      windowMs: 60 * 1000,
      limit: env.isTest ? 10000 : 300,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: { message: "Trop de requêtes. Ralentissez un peu." },
    })
  );

  if (!env.cloudinaryEnabled) {
    app.use("/uploads", express.static(LOCAL_DIR, { maxAge: "7d" }));
  }

  app.get("/api/health", (_req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

  app.use("/api", loadUser);
  app.use("/api/auth", require("./routes/auth"));
  app.use("/api/meta", require("./routes/meta"));
  app.use("/api/products", require("./routes/products"));
  app.use(
    "/api/brands",
    taxonomyRoutes({ Model: Brand, field: "brand", imageKey: "logo", label: "Marque", folder: "brands" })
  );
  app.use(
    "/api/categories",
    taxonomyRoutes({
      Model: Category,
      field: "category",
      imageKey: "image",
      label: "Catégorie",
      folder: "categories",
      extra: { group: Joi.string().valid(...Category.GROUPS).required() },
    })
  );
  app.use("/api/orders", require("./routes/orders"));
  app.use("/api/admin", require("./routes/admin"));
  app.use("/api/payments", require("./routes/payments"));

  app.use(notFound);
  app.use(errorHandler);
  return app;
};

module.exports = createApp;
