const { UniqueConstraintError, ValidationError, ForeignKeyConstraintError, DatabaseError } = require('sequelize');
const { errorResponse } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  // UniqueConstraintError extends ValidationError, so handle it first.
  if (err instanceof UniqueConstraintError) {
    const field = err.errors?.[0]?.path || 'Record';
    const formattedField = field.charAt(0).toUpperCase() + field.slice(1);
    return errorResponse(res, 409, `${formattedField} already exists`);
  }

  if (err instanceof ValidationError) {
    const errors = (err.errors || []).map((item) => ({
      field: item.path || 'field',
      message: item.message
    }));
    return errorResponse(res, 400, 'Validation failed', errors);
  }

  if (err instanceof ForeignKeyConstraintError) {
    return errorResponse(res, 400, 'Invalid reference');
  }

  if (err instanceof DatabaseError && err.parent?.code === '22P02') {
    return errorResponse(res, 400, 'Invalid ID');
  }

  if (err.statusCode) {
    return errorResponse(res, err.statusCode, err.message, err.errors);
  }

  console.error('Unhandled Error:', err);
  return errorResponse(res, 500, 'Something went wrong');
};

const notFoundHandler = (req, res) => {
  return errorResponse(res, 404, `Cannot find ${req.method} ${req.originalUrl}`);
};

module.exports = { errorHandler, notFoundHandler };
