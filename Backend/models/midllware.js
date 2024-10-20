const AppError = require("./AppError");
const CatchAsync = require("./CatchAsync");
const Product = require("./Product");
const { CategorieSchema } = require("./CategorieSchema");
const { ProductSchema } = require("./ProductSchema");
const { BrandSchema } = require("./BrandSchema");
module.exports.isAvailable = CatchAsync(async (req, res, next) => {
  const { id } = req.params;
  const product = await Product.findById(id);
  if (!product) {
    throw new AppError("Product Not Found", 404);
  }
  if (product.Quantity > 0) {
    next();
  } else {
    res.status(400).send("Product Is Out Of Stock");
  }
});

module.exports.isAuthenticated = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    res.send("You must be Admin");
  }
  next();
};

module.exports.ValidationProduct = (req, res, next) => {
  const { error } = ProductSchema.validate(req.body);

  if (error) {
    const msg = error.details.map((el) => el.message).join(",");
    throw new AppError(msg, 400);
  }
  next();
};
module.exports.ValidationBrand = (req, res, next) => {
  const { error } = BrandSchema.validate(req.body);

  if (error) {
    const msg = error.details.map((el) => el.message).join(",");
    return next(new AppError(msg, 400));
  }

  next();
};

module.exports.ValidationCategorie = (req, res, next) => {
  const { error } = CategorieSchema.validate(req.body);

  if (error) {
    const msg = error.details.map((el) => el.message).join(",");
    throw new AppError(msg, 400);
  }
  next();
};
