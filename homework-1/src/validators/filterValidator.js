const { TYPES } = require('../models/transaction');

const ACCOUNT_REGEX = /^ACC-[A-Za-z0-9]{5}$/;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;

// Parses "YYYY-MM-DD" or a full ISO 8601 datetime with timezone.
// For a date-only value, `to` means the END of that day (UTC), `from` the start.
// Returns a timestamp in ms, or null if the value is not a real date.
function parseDate(value, isEnd) {
  if (DATE_ONLY.test(value)) {
    const start = new Date(`${value}T00:00:00.000Z`);
    // reject impossible dates such as 2024-02-30 (JS would roll them over)
    if (Number.isNaN(start.getTime()) || start.toISOString().slice(0, 10) !== value) return null;
    return isEnd ? start.getTime() + 24 * 60 * 60 * 1000 - 1 : start.getTime();
  }
  if (DATE_TIME.test(value)) {
    const ms = Date.parse(value);
    return Number.isNaN(ms) ? null : ms;
  }
  return null;
}

// Validates GET /transactions query params. Returns { details, filters }.
function validateFilters(query) {
  const details = [];
  const filters = {};
  const add = (field, message) => details.push({ field, message });

  const get = (field) => {
    const value = query[field];
    if (value === undefined) return undefined;
    if (typeof value !== 'string') {
      add(field, `${field} must be a single value`);
      return undefined;
    }
    return value;
  };

  const accountId = get('accountId');
  if (accountId !== undefined) {
    if (ACCOUNT_REGEX.test(accountId)) filters.accountId = accountId;
    else add('accountId', 'accountId must follow the format ACC-XXXXX (X is alphanumeric)');
  }

  const type = get('type');
  if (type !== undefined) {
    if (TYPES.includes(type)) filters.type = type;
    else add('type', `type must be one of: ${TYPES.join(', ')}`);
  }

  const dateMessage = (f) => `${f} must be a date (YYYY-MM-DD) or an ISO 8601 datetime, e.g. 2024-01-31 or 2024-01-31T10:00:00Z`;

  const from = get('from');
  if (from !== undefined) {
    const ms = parseDate(from, false);
    if (ms === null) add('from', dateMessage('from'));
    else filters.from = ms;
  }

  const to = get('to');
  if (to !== undefined) {
    const ms = parseDate(to, true);
    if (ms === null) add('to', dateMessage('to'));
    else filters.to = ms;
  }

  if (filters.from !== undefined && filters.to !== undefined && filters.from > filters.to) {
    add('from', 'from must not be later than to');
  }

  return { details, filters };
}

module.exports = { validateFilters };
