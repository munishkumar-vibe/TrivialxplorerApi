const { body } = require("express-validator");

const signupValidator = [
  body("username")
    .trim()
    .notEmpty().withMessage("Username is required.")
    .isLength({ min: 3 }).withMessage("Username must be at least 3 characters.")
    .matches(/^[a-zA-Z0-9_]+$/).withMessage("Username can only contain letters, numbers and underscores."),

  body("firstName")
    .trim()
    .notEmpty().withMessage("First name is required."),

  body("lastName")
    .trim()
    .notEmpty().withMessage("Last name is required."),

  body("email")
    .trim()
    .notEmpty().withMessage("Email is required.")
    .isEmail().withMessage("Please provide a valid email address.")
    .normalizeEmail(),

  body("phone")
    .trim()
    .notEmpty().withMessage("Phone number is required."),

  body("dob")
    .notEmpty().withMessage("Date of birth is required.")
    .isISO8601().withMessage("Date of birth must be a valid date.")
    .custom((value) => {
      const dob = new Date(value);
      const minAge = new Date();
      minAge.setFullYear(minAge.getFullYear() - 13);
      if (dob > minAge) throw new Error("You must be at least 13 years old.");
      return true;
    }),

  body("password")
    .notEmpty().withMessage("Password is required.")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters."),

  body("confirmPassword")
    .notEmpty().withMessage("Please confirm your password.")
    .custom((value, { req }) => {
      if (value !== req.body.password) throw new Error("Passwords do not match.");
      return true;
    }),

  body("terms")
    .notEmpty().withMessage("You must accept the terms and conditions.")
    .isBoolean().withMessage("Terms must be a boolean value.")
    .custom((value) => {
      if (!value) throw new Error("You must accept the terms and conditions.");
      return true;
    }),
];

const signinValidator = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required.")
    .isEmail().withMessage("Please provide a valid email address.")
    .normalizeEmail(),

  body("password")
    .notEmpty().withMessage("Password is required."),
];

const forgotPasswordValidator = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required.")
    .isEmail().withMessage("Please provide a valid email address.")
    .normalizeEmail(),
];

const resetPasswordValidator = [
  body("password")
    .notEmpty().withMessage("Password is required.")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters."),

  body("confirmPassword")
    .notEmpty().withMessage("Please confirm your password.")
    .custom((value, { req }) => {
      if (value !== req.body.password) throw new Error("Passwords do not match.");
      return true;
    }),
];

module.exports = {
  signupValidator,
  signinValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
};
