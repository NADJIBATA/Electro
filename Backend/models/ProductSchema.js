const Joi = require("joi");

module.exports.ProductSchema = Joi.object({
  Name: Joi.string().required().min(2),
  Price: Joi.string().required().min(0),
  Image: Joi.object({
    url: Joi.string().required(),
    fileName: Joi.string().required(),
  }),
  Characteristics: Joi.array().required(),
  Quantity: Joi.number().required(),
  Brand: Joi.string().required(),
  Categorie: Joi.string().required(),
});
