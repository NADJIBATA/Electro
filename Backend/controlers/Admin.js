const Admin = require("../models/Admin");
const CatchAsync = require("../models/CatchAsync");

module.exports.LoginAdmin = CatchAsync(async (req, res, next) => {
  req.session.AdminId = req.user._id;
  res.send("Login Success");
});
module.exports.LogoutAdmin = CatchAsync(async (req, res, next) => {
  req.session.AdminId = null;
  res.send("Logout Success");
});

module.exports.registerAdmin = CatchAsync(async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const admin = new Admin({
      email: email,
      username: "admin",
    });
    const newAdmin = await Admin.register(admin, password);
    res.send(newAdmin);
  } catch (e) {
    res.send(e.message);
  }
});
