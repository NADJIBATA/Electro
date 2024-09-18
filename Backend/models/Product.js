const mongoose = require("mongoose");
const Brand = require("./Brand");
const Categorie = require("./Categorie");
const Schema = mongoose.Schema;

const ProductSchema = new Schema({
  Name: {
    type: String,
    required: true,
  },
  Price: {
    type: Number,
    required: true,
    min: 0,
  },
  Image: {
    url: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
  },
  Characteristics: {
    type: [String],
    required: false,
  },
  Quantity: {
    type: Number,
    min: 0,
    required: true,
  },
  Brand: {
    type: Schema.Types.ObjectId,
    ref: Brand,
  },
  Categorie: {
    type: Schema.Types.ObjectId,
    ref: Categorie,
  },
});

const Product = mongoose.model("Product", ProductSchema);
module.exports = Product;
