const { validationResult } = require("express-validator");
const ApiError = require("../utils/ApiError");

const validate = (req, _res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((e) => ({
      field: e.path,
      message: e.msg,
    }));
    return next(new ApiError(400, "Validation failed", formattedErrors));
  }
  next();
};

module.exports = validate;
