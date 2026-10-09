/**
 * Get the local start and end Date objects for today
 * @returns {{ start: Date, end: Date }}
 */
const getTodayDateRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

/**
 * Escapes special regex characters in a string
 * @param {string} string
 * @returns {string}
 */
const escapeRegex = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

module.exports = {
  getTodayDateRange,
  escapeRegex
};
