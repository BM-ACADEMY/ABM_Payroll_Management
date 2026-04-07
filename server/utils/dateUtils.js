
/**
 * Utility functions for handling India Standard Time (IST) in a production environment
 * where the server clock might be in UTC.
 */

const getISTDate = (date = new Date()) => {
  // Format to YYYY-MM-DD in Asia/Kolkata
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
};

const getISTTime = (date = new Date()) => {
  // Format to HH:mm in Asia/Kolkata
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date);
};

/**
 * Returns a new Date object that represents the current time in IST
 * but relative to the local machine's epoch. 
 * Use this for calculations or when passing to date-fns formatters
 * that don't support timezones directly.
 */
const getISTFullDate = (date = new Date()) => {
    return new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
};

module.exports = { getISTDate, getISTTime, getISTFullDate }; 
