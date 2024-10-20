const CatchAsync = require("../models/CatchAsync");
const Product = require("../models/Product");
const AppError = require("../models/AppError");
const mongoose = require("mongoose");
const Brand = require("../models/Brand");
const Categorie = require("../models/Categorie");
const Command = require("../models/Command");
module.exports.getProducts = async (req, res, next) => {
  try {
    const Products = await Product.find({});
    res.send(Products);
  } catch (err) {
    next(err);
  }
};

module.exports.getProduct = CatchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("Invalid Product ID format", 400));
  }
  const ProductFounded = await Product.findById(id)
    .populate("Brand")
    .populate("Categorie");
  if (!ProductFounded) {
    throw new AppError("Product Not Found", 404);
  }
  res.send(ProductFounded);
});

module.exports.postProduct = CatchAsync(async (req, res, next) => {
  const { BrandId, CategorieId } = req.body;
  const brand = await Brand.findById(BrandId);
  if (!brand) {
    throw new AppError("Brand Not Found", 404);
  }
  const categorie = await Categorie.findById(CategorieId);
  if (!categorie) {
    throw new AppError("Categorie Not Found", 404);
  }
  const product = new Product({
    Name: req.body.Name,
    Price: req.body.Price,
    Image: {
      url: req.file.path,
      fileName: req.file.filename,
    },
    Characteristics: req.body.Characteristics,
    Quantity: req.body.Quantity,
    Brand: brand,
    Categorie: categorie,
  });
  brand.Products.push(product);
  await brand.save();
  categorie.Products.push(product);
  await categorie.save();
  const ProductPosted = await product.save();
  res.status(201).send(ProductPosted);
});

module.exports.deleteProduct = CatchAsync(async (req, res, next) => {
  const { id } = req.params;
  const ProductDeleted = await Product.findByIdAndDelete(id);
  if (!ProductDeleted) {
    throw new AppError("Product Not Found", 404);
  }
  res.send(ProductDeleted);
});

module.exports.UpdateProduct = CatchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { BrandId, CategorieId } = req.body;
  const brand = await Brand.findById(BrandId);
  const categorie = await Categorie.findById(CategorieId);
  const ProductUpdated = await Product.findByIdAndUpdate(
    id,
    {
      Name: req.body.Name,
      Price: req.body.Price,
      Image: {
        url: req.file.path,
        fileName: req.file.filename,
      },
      Characteristics: req.body.Characteristics,
      Quantity: req.body.Quantity,
      Brand: brand,
      Categorie: categorie,
    },
    { new: true }
  );
  if (!ProductUpdated) {
    throw new AppError("Product Not Found");
  }
  res.status(201).send(ProductUpdated);
});
module.exports.buyProduct = CatchAsync(async (req, res, next) => {
  const { id } = req.params;
  const buyer = req.body;
  const product = await Product.findById(id);
  const command = new Command({
    Buyer: {
      FirstName: buyer.FirstName,
      LastName: buyer.LastName,
      PhpneNumber: buyer.PhpneNumber,
      Location: {
        City: buyer.City,
        Municipality: buyer.Municipality,
      },
    },
    Product: product,
  });
  product.Quantity -= 1;
  await product.save();
  await command.save();
  res.send({ product, command });
});
