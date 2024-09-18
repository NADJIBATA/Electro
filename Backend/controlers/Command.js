const CatchAsync = require("../models/CatchAsync");
const Product = require("../models/Product");
const AppError = require("../models/AppError");
const mongoose = require("mongoose");
const Command = require("../models/Command");
module.exports.getCommands = async (req, res, next) => {
  try {
    const Commands = await Command.find({});
    res.send(Commands);
  } catch (err) {
    next(err);
  }
};

module.exports.getCommand = CatchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("Invalid Command ID format", 400));
  }
  const CommandFounded = await Command.findById(id).populate("Product");
  if (!CommandFounded) {
    throw new AppError("Command Not Found", 404);
  }
  res.send(CommandFounded);
});

module.exports.deleteCommand = CatchAsync(async (req, res, next) => {
  const { id } = req.params;
  const CommandDeleted = await Command.findByIdAndDelete(id);
  if (!CommandDeleted) {
    throw new AppError("Command Not Found", 404);
  }
  const product = await Product.findById(CommandDeleted.Product._id);
  if (product) {
    if (!product.isDelivered) {
      product.Quantity += 1;
      await product.save();
    }
  }
  res.send(CommandDeleted);
});
module.exports.delivredCommand = CatchAsync(async (req, res, next) => {
  const { id } = req.params;
  const CommandDeleted = await Command.findByIdAndUpdate(
    id,
    {
      isDelivered: true,
    },
    {
      new: true,
    }
  );
  if (!CommandDeleted) {
    throw new AppError("Command Not Found", 404);
  }

  res.send(CommandDeleted);
});
