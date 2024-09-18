const Joi = require("joi");

module.exports.BrandSchema = Joi.object({
  Name: Joi.string().required(),
  Logo: Joi.object({
    fileName: Joi.string().required(),
    url: Joi.string().required(),
  }).required(),
});
