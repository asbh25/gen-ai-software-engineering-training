const { TYPES } = require('../models/transaction');

// Basic validation for Task 1. Task 2 will extend it (2 decimals, ACC-XXXXX, ISO 4217).
function validateTransaction(body) {
  const details = [];
  const add = (field, message) => details.push({ field, message });

  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return [{ field: 'body', message: 'Request body must be a JSON object' }];
  }

  const { fromAccount, toAccount, amount, currency, type } = body;

  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    add('amount', 'Amount must be a positive number');
  }

  if (typeof currency !== 'string' || currency.trim() === '') {
    add('currency', 'Currency is required');
  }

  if (!TYPES.includes(type)) {
    add('type', `Type must be one of: ${TYPES.join(', ')}`);
    return details;
  }

  const isAccount = (v) => typeof v === 'string' && v.trim() !== '';

  if ((type === 'withdrawal' || type === 'transfer') && !isAccount(fromAccount)) {
    add('fromAccount', `fromAccount is required for ${type}`);
  }
  if ((type === 'deposit' || type === 'transfer') && !isAccount(toAccount)) {
    add('toAccount', `toAccount is required for ${type}`);
  }
  if (type === 'transfer' && isAccount(fromAccount) && fromAccount === toAccount) {
    add('toAccount', 'toAccount must differ from fromAccount');
  }

  return details;
}

module.exports = { validateTransaction };
