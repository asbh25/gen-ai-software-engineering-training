const { TYPES } = require('../models/transaction');
const { CURRENCIES } = require('../utils/currencies');

const ACCOUNT_REGEX = /^ACC-[A-Za-z0-9]{5}$/;

// At most 2 decimal places. Compares against the nearest cent with a tiny
// tolerance so 0.29 passes (0.29 * 100 = 28.999999999999996) and 1.005 fails.
function hasMaxTwoDecimals(n) {
  const cents = n * 100;
  return Math.abs(cents - Math.round(cents)) < 1e-8;
}

const isPresent = (v) => v !== undefined && v !== null;

function validateTransaction(body) {
  const details = [];
  const add = (field, message) => details.push({ field, message });

  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return [{ field: 'body', message: 'Request body must be a JSON object' }];
  }

  const { fromAccount, toAccount, amount, currency, type } = body;

  // amount: positive number, max 2 decimal places
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    add('amount', 'Amount must be a positive number');
  } else if (!hasMaxTwoDecimals(amount)) {
    add('amount', 'Amount must have at most 2 decimal places');
  }

  // currency: ISO 4217 code (uppercase)
  if (!isPresent(currency)) {
    add('currency', 'Currency is required');
  } else if (typeof currency !== 'string' || !CURRENCIES.has(currency)) {
    add('currency', 'Invalid currency code (use an uppercase ISO 4217 code, e.g. USD, EUR, GBP)');
  }

  // type
  if (!TYPES.includes(type)) {
    add('type', `Type must be one of: ${TYPES.join(', ')}`);
  }

  // accounts: required depending on type, and any provided account must match ACC-XXXXX
  const needsFrom = type === 'withdrawal' || type === 'transfer';
  const needsTo = type === 'deposit' || type === 'transfer';
  const accountFormatMessage = 'Account must follow the format ACC-XXXXX (X is alphanumeric)';

  const checkAccount = (field, value, required) => {
    if (!isPresent(value)) {
      if (required) add(field, `${field} is required for ${type}`);
    } else if (typeof value !== 'string' || !ACCOUNT_REGEX.test(value)) {
      add(field, accountFormatMessage);
    }
  };

  checkAccount('fromAccount', fromAccount, needsFrom);
  checkAccount('toAccount', toAccount, needsTo);

  if (type === 'transfer' && isPresent(fromAccount) && fromAccount === toAccount) {
    add('toAccount', 'toAccount must differ from fromAccount');
  }

  return details;
}

module.exports = { validateTransaction };
