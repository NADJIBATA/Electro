const express = require("express");
const multer = require("multer");

const {
  getCategorie,
  getCategories,
  postCategorie,
  deleteCategorie,
  UpdateCategorie,
} = require("../controlers/Categorie");
const route = express.Router();
const { storage } = require("../cloudinary/index");
const path = require("path");
const { isAuthenticated, ValidationCategorie } = require("../models/midllware");
const upload = multer({ dest: path.join(__dirname, "../Uploads") });

route.get("/", getCategories);
route.get("/:id", getCategorie);
route.post(
  "/",
  isAuthenticated,
  ValidationCategorie,
  upload.single("Logo"),
  postCategorie
);
route.delete("/:id/deleteCategory", isAuthenticated, deleteCategorie);
route.put(
  "/:id/updateCategory",
  isAuthenticated,
  ValidationCategorie,
  upload.single("Logo"),
  UpdateCategorie
);
module.exports = route;
