/**
 * Standard Success Response Helper
 * @param {import('express').Response} res
 * @param {number} statusCode
 * @param {string} message
 * @param {any} data
 */
const successResponse = (res, statusCode = 200, message = 'Success', data = null) => {
  const responsePayload = {
    success: true,
    message
  };

  if (Array.isArray(data)) {
    responsePayload.count = data.length;
    responsePayload.data = data;
  } else if (data !== null && data !== undefined) {
    responsePayload.data = data;
  }

  return res.status(statusCode).json(responsePayload);
};

/**
 * Standard Error Response Helper
 * @param {import('express').Response} res
 * @param {number} statusCode
 * @param {string} message
 * @param {Array<{field?: string, message: string}>} [errors]
 */
const errorResponse = (res, statusCode = 500, message = 'Something went wrong', errors = null) => {
  const responsePayload = {
    success: false,
    message
  };

  if (errors && Array.isArray(errors) && errors.length > 0) {
    responsePayload.errors = errors;
  }

  return res.status(statusCode).json(responsePayload);
};

module.exports = {
  successResponse,
  errorResponse
};
