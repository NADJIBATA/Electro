const Joi = require("joi");

module.exports.CategorieSchema = Joi.object({
  Name: Joi.string().required().min(2),
  Logo: Joi.object({
    url: Joi.string().required(),
    fileName: Joi.string().required(),
  }),
});
