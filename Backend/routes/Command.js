const express = require("express");
const {
  getCommands,
  getCommand,
  deleteCommand,
  delivredCommand,
} = require("../controlers/Command");
const { isAuthenticated } = require("../models/midllware");
const route = express.Router();

route.get("/", isAuthenticated, getCommands);
route.get("/:id", isAuthenticated, getCommand);
route.delete("/:id/deleteCommand", isAuthenticated, deleteCommand);
route.put("/:id/deleivredCommand", isAuthenticated, delivredCommand);

module.exports = route;
