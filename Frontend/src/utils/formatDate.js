/**
 * Formats an ISO UTC date string for display in localized human readable format.
 *
 * @param {string|Date} dateInput - ISO string or Date instance
 * @param {Intl.DateTimeFormatOptions} [options] - Optional custom formatting options
 * @returns {string} Formatted date/time string
 */
export function formatDateTime(dateInput, options = {}) {
  if (!dateInput) return '—';

  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return 'Invalid date';

    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      ...options,
    };

    return date.toLocaleString(undefined, defaultOptions);
  } catch {
    return '—';
  }
}

/**
 * Formats a date only (e.g., 10 Oct 2026)
 * @param {string|Date} dateInput
 * @returns {string}
 */
export function formatDateOnly(dateInput) {
  return formatDateTime(dateInput, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Formats time only (e.g., 10:30 AM)
 * @param {string|Date} dateInput
 * @returns {string}
 */
export function formatTimeOnly(dateInput) {
  return formatDateTime(dateInput, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}
