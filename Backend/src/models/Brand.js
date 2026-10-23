const mongoose = require("mongoose");
const imageSchema = require("./imageSchema");

const BrandSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, maxlength: 60 },
    slug: { type: String, required: true, unique: true },
    logo: { type: imageSchema, default: null },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("Brand", BrandSchema);
