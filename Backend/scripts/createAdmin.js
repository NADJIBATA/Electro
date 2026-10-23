// Usage : npm run create-admin -- email@exemple.com MotDePasse123
const mongoose = require("mongoose");
const { connectDB } = require("../src/config/db");
const User = require("../src/models/User");

const [email, password] = process.argv.slice(2);

(async () => {
  if (!email || !password || password.length < 8) {
    console.error("Usage : npm run create-admin -- <email> <mot-de-passe (8 caractères min.)>");
    process.exit(1);
  }
  await connectDB();
  let user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (user) {
    user.role = "admin";
    user.password = password;
    await user.save();
    console.log(`Compte existant ${user.email} : promu admin et mot de passe mis à jour.`);
  } else {
    user = await User.create({ firstName: "Admin", lastName: "Electro", email, password, role: "admin" });
    console.log(`Admin créé : ${user.email}`);
  }
  await mongoose.disconnect();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
