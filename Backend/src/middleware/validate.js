const AppError = require("../utils/AppError");

// Valide req[source] avec un schéma Joi et remplace par la valeur nettoyée
module.exports = (schema, source = "body") => (req, _res, next) => {
  const { error, value } = schema.validate(req[source], {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });
  if (error) {
    const details = error.details.map((d) => ({ field: d.path.join("."), message: d.message }));
    return next(new AppError("Données invalides.", 400, details));
  }
  if (source === "query") {
    // req.query est un getter en Express 5 ; on stocke la version validée à part
    req.validatedQuery = value;
  } else {
    req[source] = value;
  }
  return next();
};
