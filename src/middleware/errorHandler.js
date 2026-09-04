const multer = require('multer');
const logger = require('../utils/logger');

const errorHandler = (err, _req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong.';
  let errors = err.errors || [];
  let isOperational = err.isOperational || false;
  let field = err.field || null;
  let meta = err.meta || null;

  // Multer file size exceeded
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    isOperational = true;
    field = err.field || null;
    if (field === 'video') {
      statusCode = 413;
      message = 'Video exceeds the 200MB upload limit.';
      meta = { maxSizeMB: 200 };
    } else {
      statusCode = 400;
      message = 'File exceeds the 5MB upload limit.';
      meta = { maxSizeMB: 5 };
    }
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const f = Object.keys(err.keyValue)[0];
    statusCode = 409;
    message = `An account with this ${f} already exists.`;
    isOperational = true;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    isOperational = true;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please sign in again.';
    isOperational = true;
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Your session has expired. Please sign in again.';
    isOperational = true;
  }

  if (!isOperational) {
    logger.error('Unexpected error:', err);
  }

  const resolvedMessage =
    process.env.NODE_ENV === 'production' && !isOperational ? 'Something went wrong.' : message;

  const body = { success: false, message: resolvedMessage };
  if (field) body.field = field;
  if (meta) body.meta = meta;
  if (errors.length) body.data = { errors };
  else if (!field) body.data = null;

  res.status(statusCode).json(body);
};

module.exports = errorHandler;
