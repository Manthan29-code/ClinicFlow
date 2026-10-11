const normalizeForApi = (value) => {
  if (value === null || value === undefined) return value;

  const plain = typeof value.toJSON === 'function'
    ? value.toJSON()
    : value;

  if (Array.isArray(plain)) {
    return plain.map(normalizeForApi);
  }

  if (typeof plain !== 'object' || plain instanceof Date) {
    return plain;
  }

  const result = {};
  for (const [key, nestedValue] of Object.entries(plain)) {
    if (['patientId', 'doctorId', 'appointmentId'].includes(key)) continue;
    const outputKey = key === 'id' ? '_id' : key;
    result[outputKey] = normalizeForApi(nestedValue);
  }
  return result;
};

/**
 * Keep the original API envelope and _id convention for Sequelize objects.
 */
const successResponse = (res, statusCode = 200, message = 'Success', data = null) => {
  const responsePayload = { success: true, message };

  if (Array.isArray(data)) {
    responsePayload.count = data.length;
    responsePayload.data = normalizeForApi(data);
  } else if (data !== null && data !== undefined) {
    responsePayload.data = normalizeForApi(data);
  }

  return res.status(statusCode).json(responsePayload);
};

const errorResponse = (res, statusCode = 500, message = 'Something went wrong', errors = null) => {
  const responsePayload = { success: false, message };

  if (errors && Array.isArray(errors) && errors.length > 0) {
    responsePayload.errors = errors;
  }

  return res.status(statusCode).json(responsePayload);
};

module.exports = { successResponse, errorResponse };
