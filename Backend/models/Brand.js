const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const BrandSchema = new Schema({
  Name: {
    type: String,
    required: true,
    unique: true,
  },
  Logo: {
    url: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
  },
  Products: [
    {
      type: Schema.Types.ObjectId,
      ref: "Product",
    },
  ],
});

const Brand = mongoose.model("Brand", BrandSchema);
module.exports = Brand;
