const rateLimit = require("express-rate-limit");

const globalRateLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
    data: null,
  },
});

const authRateLimiter = rateLimit({
  windowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.AUTH_RATE_LIMIT_MAX) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts, please try again after 15 minutes.",
    data: null,
  },
});

// Throttles state-changing social actions (e.g. follow/unfollow) to stop
// scripted mass-follow abuse without affecting normal browsing.
const writeRateLimiter = rateLimit({
  windowMs: Number(process.env.WRITE_RATE_LIMIT_WINDOW_MS) || 60 * 1000,
  max: Number(process.env.WRITE_RATE_LIMIT_MAX) || 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "You're doing that too fast. Please slow down.",
    data: null,
  },
});

module.exports = { globalRateLimiter, authRateLimiter, writeRateLimiter };
