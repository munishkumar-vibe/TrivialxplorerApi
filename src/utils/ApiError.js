class ApiError extends Error {
  constructor(statusCode, message, errors = [], field = null, meta = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.field = field;
    this.meta = meta;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;
