const CatchAsync = require("../models/CatchAsync");
const Categorie = require("../models/Categorie");
const AppError = require("../models/AppError");
const mongoose = require("mongoose");

module.exports.getCategories = async (req, res, next) => {
  try {
    const Categories = await Categorie.find({});
    res.send(Categories);
  } catch (err) {
    next(err);
  }
};

module.exports.getCategorie = CatchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("Invalid Categorie ID format", 400));
  }
  const CategorieFounded = await Categorie.findById(id).populate("Products");
  if (!CategorieFounded) {
    throw new AppError("Categorie Not Found", 404);
  }
  res.send(CategorieFounded);
});

module.exports.postCategorie = CatchAsync(async (req, res, next) => {
  const categorie = new Categorie({
    Name: req.body.Name,
    Logo: {
      url: req.file.path,
      fileName: req.file.filename,
    },
  });

  const CategoriePosted = await categorie.save();
  res.status(201).send(CategoriePosted);
});

module.exports.deleteCategorie = CatchAsync(async (req, res, next) => {
  const { id } = req.params;
  const CategorieDeleted = await Categorie.findByIdAndDelete(id);
  if (!CategorieDeleted) {
    throw new AppError("Categorie Not Found", 404);
  }
  res.send(CategorieDeleted);
});

module.exports.UpdateCategorie = CatchAsync(async (req, res, next) => {
  const { id } = req.params;
  const CategorieUpdated = await Product.findByIdAndUpdate(
    id,
    {
      Name: req.body.Name,
      Logo: {
        url: req.file.path,
        fileName: req.file.filename,
      },
    },
    { new: true }
  );
  if (!CategorieUpdated) {
    throw new AppError("Categorie Not Found");
  }
  res.status(201).send(CategorieUpdated);
});
