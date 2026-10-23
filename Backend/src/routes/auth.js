const express = require("express");
const Joi = require("joi");
const rateLimit = require("express-rate-limit");
const env = require("../config/env");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const validate = require("../middleware/validate");
const { requireAuth, setAuthCookie, clearAuthCookie } = require("../middleware/auth");

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.isTest ? 1000 : 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Trop de tentatives. Réessayez dans quelques minutes." },
});

const phone = Joi.string().trim().pattern(/^(\+213|0)[5-7]\d{8}$/).messages({
  "string.pattern.base": "Numéro de téléphone algérien invalide (ex. 0551234567).",
});

const registerSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(60).required(),
  lastName: Joi.string().trim().min(2).max(60).required(),
  email: Joi.string().trim().lowercase().email().required(),
  phone: phone.allow(""),
  password: Joi.string().min(8).max(128).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
  password: Joi.string().required(),
});

const profileSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(60),
  lastName: Joi.string().trim().min(2).max(60),
  phone: phone.allow(""),
  address: Joi.object({
    wilaya: Joi.number().integer().min(1).max(69).allow(null),
    commune: Joi.string().trim().max(80).allow(""),
    line: Joi.string().trim().max(200).allow(""),
  }),
  currentPassword: Joi.string(),
  newPassword: Joi.string().min(8).max(128),
}).with("newPassword", "currentPassword");

router.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const user = await User.create({ ...req.body, role: "customer" });
    setAuthCookie(res, user);
    res.status(201).json({ user });
  })
);

router.post(
  "/login",
  authLimiter,
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const user = await User.findOne({ email: req.body.email }).select("+password");
    if (!user || !(await user.comparePassword(req.body.password))) {
      throw new AppError("Email ou mot de passe incorrect.", 401);
    }
    setAuthCookie(res, user);
    res.json({ user });
  })
);

router.post("/logout", (_req, res) => {
  clearAuthCookie(res);
  res.json({ message: "Déconnecté." });
});

router.get("/me", (req, res) => {
  res.json({ user: req.user || null });
});

router.patch(
  "/me",
  requireAuth,
  validate(profileSchema),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select("+password");
    const { currentPassword, newPassword, ...rest } = req.body;
    if (newPassword) {
      if (!(await user.comparePassword(currentPassword))) {
        throw new AppError("Mot de passe actuel incorrect.", 400);
      }
      user.password = newPassword;
    }
    Object.assign(user, rest);
    await user.save();
    res.json({ user });
  })
);

module.exports = router;
module.exports.phoneSchema = phone;
