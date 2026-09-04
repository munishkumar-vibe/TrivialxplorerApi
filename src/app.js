const path = require("path");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");
const { globalRateLimiter } = require("./middleware/rateLimiter");
const errorHandler = require("./middleware/errorHandler");
const authRoutes = require("./routes/auth.routes");
const blogRoutes = require("./routes/blog.routes");
const videoRoutes = require("./routes/video.routes");
const itineraryRoutes = require("./routes/itinerary.routes");
const exploreRoutes   = require("./routes/explore.routes");
const adminRoutes     = require("./routes/admin.routes");
const followRoutes    = require("./routes/follow.routes");
const usersRoutes     = require("./routes/users.routes");
const ApiError = require("./utils/ApiError");

const app = express();

// Security headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parsers
const bodyLimit = process.env.REQUEST_BODY_LIMIT || "10kb";
app.use(express.json({ limit: bodyLimit }));
app.use(express.urlencoded({ extended: true, limit: bodyLimit }));
app.use(cookieParser());

// Sanitize NoSQL query injection
app.use(mongoSanitize());

// HTTP request logger (only in development)
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Global rate limiter
app.use(globalRateLimiter);

// Health check
app.get("/health", (_req, res) => {
  res.status(200).json({ success: true, message: "API is running", data: null });
});

// Serve uploaded media files
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/blog", blogRoutes);
app.use("/api/video", videoRoutes);
app.use("/api/itinerary", itineraryRoutes);
app.use("/api/explore",   exploreRoutes);
app.use("/api/admin",     adminRoutes);
app.use("/api/follow",    followRoutes);
app.use("/api/users",     usersRoutes);

// 404 handler
app.use((_req, _res, next) => {
  next(new ApiError(404, "Route not found"));
});

// Global error handler
app.use(errorHandler);

module.exports = app;
