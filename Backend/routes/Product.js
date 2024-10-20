const express = require("express");
const multer = require("multer");

const {
  getProduct,
  getProducts,
  postProduct,
  deleteProduct,
  UpdateProduct,
  buyProduct,
} = require("../controlers/Product");
const route = express.Router();
const { storage } = require("../cloudinary/index");
const path = require("path");
const {
  isAvailable,
  isAuthenticated,
  ValidationProduct,
} = require("../models/midllware");
const upload = multer({ dest: path.join(__dirname, "../Uploads") });

route.get("/", getProducts);
route.get("/:id", getProduct);
route.post(
  "/",
  upload.single("Image"),
  isAuthenticated,
  ValidationProduct,
  postProduct
);
route.delete("/:id/deleteProduct", isAuthenticated, deleteProduct);
route.put(
  "/:id/updateProduct",
  isAuthenticated,
  ValidationProduct,
  upload.single("Image"),
  UpdateProduct
);
route.post("/:id/buyProduct", isAvailable, buyProduct);
module.exports = route;
