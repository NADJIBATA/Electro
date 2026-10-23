class AppError extends Error {
  constructor(message, status = 500, details) {
    super(message);
    this.name = "AppError";
    this.status = status;
    if (details) this.details = details;
  }
}

module.exports = AppError;
