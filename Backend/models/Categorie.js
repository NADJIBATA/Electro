const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CategorieSchema = new Schema({
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

const Categorie = mongoose.model("Categorie", CategorieSchema);
module.exports = Categorie;
