const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");
const AdminSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
});

AdminSchema.plugin(passportLocalMongoose, { usernameField: "email" });

const Admin = mongoose.model("Admin", AdminSchema);
module.exports = Admin;
