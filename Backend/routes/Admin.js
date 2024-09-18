const express = require("express");
const route = express.Router();
const passport = require("passport");
const Admin = require("../models/Admin");
const {
  registerAdmin,
  LoginAdmin,
  LogoutAdmin,
} = require("../controlers/Admin");

route.post("/registerAdmin", registerAdmin);
route.post("/loginAdmin", passport.authenticate("local"), LoginAdmin);
route.get("/logoutAdmin", LogoutAdmin);
module.exports = route;
