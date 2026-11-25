const { randomUUID } = require('crypto');

const TYPES = ['deposit', 'withdrawal', 'transfer'];

// In-memory storage (no database required)
const transactions = [];

function create({ fromAccount, toAccount, amount, currency, type }, outcome = {}) {
  const transaction = {
    id: randomUUID(),
    fromAccount: fromAccount ?? null,
    toAccount: toAccount ?? null,
    amount,
    currency,
    type,
    timestamp: new Date().toISOString(),
    // Processed immediately: completed, or failed when the account has insufficient funds
    status: outcome.status ?? 'completed',
  };
  if (transaction.status === 'failed' && outcome.failureReason) {
    transaction.failureReason = outcome.failureReason;
  }
  transactions.push(transaction);
  return transaction;
}

// Adds a ready-made transaction (custom timestamp/status). Only used by the sample-data
// loader, never by the API, so clients still can't set timestamps themselves.
function seed(data) {
  const transaction = {
    id: randomUUID(),
    fromAccount: data.fromAccount ?? null,
    toAccount: data.toAccount ?? null,
    amount: data.amount,
    currency: data.currency,
    type: data.type,
    timestamp: data.timestamp,
    status: data.status ?? 'completed',
  };
  if (data.failureReason) transaction.failureReason = data.failureReason;
  transactions.push(transaction);
  return transaction;
}

// Removes everything (used by the automated tests).
function clear() {
  transactions.length = 0;
}

const findAll = () => transactions;
const findById = (id) => transactions.find((t) => t.id === id);

module.exports = { TYPES, create, seed, clear, findAll, findById };
