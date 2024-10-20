const express = require("express");
const multer = require("multer");

const {
  getBrand,
  getBrands,
  postBrand,
  deleteBrand,
  UpdateBrand,
} = require("../controlers/Brand");
const route = express.Router();
const { storage } = require("../cloudinary/index");
const path = require("path");
const { isAuthenticated, ValidationBrand } = require("../models/midllware");
const upload = multer({ dest: path.join(__dirname, "../Uploads") });

route.get("/", getBrands);
route.get("/:id", getBrand);
route.post(
  "/",
  isAuthenticated,
  ValidationBrand,
  upload.single("Logo"),
  postBrand
);
route.delete("/:id/deleteBrand", isAuthenticated, deleteBrand);
route.put(
  "/:id/updateBrand",
  isAuthenticated,
  ValidationBrand,
  upload.single("Logo"),
  UpdateBrand
);
module.exports = route;
