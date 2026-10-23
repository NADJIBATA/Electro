const mongoose = require("mongoose");
const imageSchema = require("./imageSchema");

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 140 },
    slug: { type: String, required: true, unique: true },
    description: { type: String, default: "", maxlength: 5000 },
    price: { type: Number, required: true, min: 0 }, // en dinars (DA)
    oldPrice: { type: Number, min: 0, default: null }, // prix barré (promo)
    stock: { type: Number, required: true, min: 0, default: 0 },
    images: { type: [imageSchema], default: [] },
    characteristics: { type: [String], default: [] },
    brand: { type: mongoose.Schema.Types.ObjectId, ref: "Brand", required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    group: { type: String, enum: ["gros-menagers", "petits-menagers"], required: true },
    featured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false }
);

ProductSchema.index({ isActive: 1, category: 1 });
ProductSchema.index({ isActive: 1, brand: 1 });
ProductSchema.index({ isActive: 1, group: 1, price: 1 });

module.exports = mongoose.model("Product", ProductSchema);
