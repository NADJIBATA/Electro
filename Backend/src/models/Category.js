const mongoose = require("mongoose");
const imageSchema = require("./imageSchema");

const GROUPS = ["gros-menagers", "petits-menagers"];

const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, maxlength: 60 },
    slug: { type: String, required: true, unique: true },
    group: { type: String, enum: GROUPS, required: true },
    image: { type: imageSchema, default: null },
  },
  { timestamps: true, versionKey: false }
);

const Category = mongoose.model("Category", CategorySchema);
Category.GROUPS = GROUPS;
module.exports = Category;
