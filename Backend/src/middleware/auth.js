const jwt = require("jsonwebtoken");
const env = require("../config/env");
const User = require("../models/User");
const AppError = require("../utils/AppError");

const COOKIE_NAME = "electro_token";

const signToken = (user) =>
  jwt.sign({ sub: user._id.toString(), role: user.role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });

const cookieOptions = () => ({
  httpOnly: true,
  secure: env.isProd,
  sameSite: env.COOKIE_SAMESITE,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
});

const setAuthCookie = (res, user) => {
  res.cookie(COOKIE_NAME, signToken(user), cookieOptions());
};

const clearAuthCookie = (res) => {
  const { maxAge, ...opts } = cookieOptions();
  res.clearCookie(COOKIE_NAME, opts);
};

const readToken = (req) => {
  const header = req.get("authorization") || "";
  if (header.startsWith("Bearer ")) return header.slice(7);
  return req.cookies?.[COOKIE_NAME] || null;
};

// Renseigne req.user si un jeton valide est présent, sans bloquer sinon
const loadUser = async (req, _res, next) => {
  const token = readToken(req);
  if (!token) return next();
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (user) req.user = user;
  } catch {
    // jeton invalide ou expiré : on continue en visiteur
  }
  return next();
};

const requireAuth = (req, _res, next) => {
  if (!req.user) return next(new AppError("Vous devez être connecté.", 401));
  return next();
};

const requireAdmin = (req, _res, next) => {
  if (!req.user) return next(new AppError("Vous devez être connecté.", 401));
  if (req.user.role !== "admin") return next(new AppError("Accès réservé à l'administrateur.", 403));
  return next();
};

module.exports = { loadUser, requireAuth, requireAdmin, setAuthCookie, clearAuthCookie, signToken, COOKIE_NAME };
