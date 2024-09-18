const CatchAsync = require("../models/CatchAsync");
const Brand = require("../models/Brand");
const AppError = require("../models/AppError");
const mongoose = require("mongoose");
module.exports.getBrands = async (req, res, next) => {
  try {
    const Brands = await Brand.find({});
    res.send(Brands);
  } catch (err) {
    next(err);
  }
};

module.exports.getBrand = CatchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("Invalid Brand ID format", 400));
  }
  const BrandFounded = await Brand.findById(id).populate("Products");
  if (!BrandFounded) {
    throw new AppError("Brand Not Found", 404);
  }
  res.send(BrandFounded);
});

module.exports.postBrand = CatchAsync(async (req, res, next) => {
  const brand = new Brand({
    Name: req.body.Name,
    Logo: {
      url: req.file.path,
      fileName: req.file.filename,
    },
  });

  const BrandPosted = await brand.save();
  res.status(201).send(BrandPosted);
});

module.exports.deleteBrand = CatchAsync(async (req, res, next) => {
  const { id } = req.params;
  const BrandDeleted = await Brand.findByIdAndDelete(id);
  if (!BrandDeleted) {
    throw new AppError("Brand Not Found", 404);
  }
  res.send(BrandDeleted);
});

module.exports.UpdateBrand = CatchAsync(async (req, res, next) => {
  const { id } = req.params;
  const BrandUpdated = await Product.findByIdAndUpdate(
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
  if (!BrandUpdated) {
    throw new AppError("Brand Not Found");
  }
  res.status(201).send(BrandUpdated);
});
