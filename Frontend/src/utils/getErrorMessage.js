/**
 * Extracts a safe, user-friendly error message from Axios errors or server response envelopes.
 * Handles server downtime, validation error envelopes, and fallback error messages.
 *
 * @param {any} error - The caught error object
 * @returns {string} Safe error message
 */
export function getErrorMessage(error) {
  if (!error) {
    return 'An unexpected error occurred';
  }

  // If error has a response from Express backend
  if (error.response) {
    const data = error.response.data;

    if (data) {
      if (typeof data === 'string') {
        return data;
      }
      if (data.message) {
        return data.message;
      }
      if (Array.isArray(data.errors) && data.errors.length > 0) {
        return data.errors[0].message || 'Validation error';
      }
    }

    // HTTP status code fallbacks
    switch (error.response.status) {
      case 400:
        return 'Bad request. Please check your inputs.';
      case 401:
        return 'Session expired or unauthorized. Please log in again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'Requested resource was not found.';
      case 409:
        return data?.message || 'A conflict occurred. Record may already exist.';
      case 500:
        return 'Internal server error. Please try again later.';
      default:
        return `Server error (${error.response.status})`;
    }
  }

  // Network error or server not reachable
  if (error.request) {
    return 'Cannot reach server. Please ensure the backend is running.';
  }

  return error.message || 'An unexpected error occurred';
}

/**
 * Extracts field-specific validation errors from an Axios error response
 * @param {any} error
 * @returns {Record<string, string>} Map of field name to error message
 */
export function extractFieldErrors(error) {
  const fieldErrors = {};
  if (error?.response?.data?.errors && Array.isArray(error.response.data.errors)) {
    error.response.data.errors.forEach((err) => {
      if (err.field && err.message) {
        fieldErrors[err.field] = err.message;
      }
    });
  }
  return fieldErrors;
}
