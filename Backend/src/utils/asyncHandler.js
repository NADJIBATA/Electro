// Transmet les erreurs des handlers async au gestionnaire d'erreurs d'Express
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
