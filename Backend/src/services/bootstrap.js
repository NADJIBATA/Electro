const env = require("../config/env");
const User = require("../models/User");

// Crée le premier compte admin à partir de ADMIN_EMAIL / ADMIN_PASSWORD s'il n'en existe aucun
const ensureAdmin = async () => {
  if (await User.exists({ role: "admin" })) return null;
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
    console.warn("Aucun admin : définissez ADMIN_EMAIL et ADMIN_PASSWORD, ou lancez `npm run create-admin`.");
    return null;
  }
  const existing = await User.findOne({ email: env.ADMIN_EMAIL.toLowerCase() });
  if (existing) {
    existing.role = "admin";
    await existing.save();
    console.log(`Compte ${existing.email} promu administrateur.`);
    return existing;
  }
  const admin = await User.create({
    firstName: "Admin",
    lastName: env.STORE_NAME,
    email: env.ADMIN_EMAIL,
    password: env.ADMIN_PASSWORD,
    role: "admin",
  });
  console.log(`Compte administrateur créé : ${admin.email}`);
  return admin;
};

module.exports = { ensureAdmin };
