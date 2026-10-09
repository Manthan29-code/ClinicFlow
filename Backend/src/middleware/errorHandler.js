const { errorResponse } = require('../utils/response');

/**
 * Global centralized error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const errors = Object.keys(err.errors).map((field) => ({
      field,
      message: err.errors[field].message
    }));
    return errorResponse(res, 400, 'Validation failed', errors);
  }

  // MongoDB Duplicate Key Error
  if (err.code === 11000) {
    let field = 'Record';
    if (err.keyValue) {
      field = Object.keys(err.keyValue)[0];
    } else if (err.keyPattern) {
      field = Object.keys(err.keyPattern)[0];
    }
    const formattedField = field.charAt(0).toUpperCase() + field.slice(1);
    return errorResponse(res, 409, `${formattedField} already exists`);
  }

  // Mongoose Cast Error (Invalid ObjectId)
  if (err.name === 'CastError') {
    return errorResponse(res, 400, 'Invalid ID format');
  }

  // Explicit status code on error
  if (err.statusCode) {
    return errorResponse(res, err.statusCode, err.message, err.errors);
  }

  // Unexpected server error
  console.error('Unhandled Error:', err);
  return errorResponse(res, 500, 'Something went wrong');
};

/**
 * 404 Not Found Middleware for unhandled routes
 */
const notFoundHandler = (req, res) => {
  return errorResponse(res, 404, `Cannot find ${req.method} ${req.originalUrl}`);
};

module.exports = {
  errorHandler,
  notFoundHandler
};
