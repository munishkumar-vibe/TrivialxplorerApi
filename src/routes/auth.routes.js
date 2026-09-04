const { Router } = require("express");
const controller = require("../controllers/auth.controller");
const { authRateLimiter } = require("../middleware/rateLimiter");
const { protect } = require("../middleware/auth.middleware");
const validate = require("../middleware/validate");
const {
  signupValidator,
  signinValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} = require("../validators/auth.validator");

const router = Router();

// Public routes (rate limited)
router.post("/signup", authRateLimiter, signupValidator, validate, controller.signup);
router.post("/signin", authRateLimiter, signinValidator, validate, controller.signin);
router.post("/refresh-token", controller.refreshToken);
router.post("/signout", controller.signout);
router.post("/forgot-password", authRateLimiter, forgotPasswordValidator, validate, controller.forgotPassword);
router.post("/reset-password", authRateLimiter, resetPasswordValidator, validate, controller.resetPassword);

// Session check — used by Next.js middleware (no token rotation)
router.get("/verify", controller.verifySession);

// Protected routes
router.get("/me", protect, controller.getMe);

module.exports = router;
