const { randomUUID } = require('crypto');

const TYPES = ['deposit', 'withdrawal', 'transfer'];

// In-memory storage (no database required)
const transactions = [];

function create({ fromAccount, toAccount, amount, currency, type }) {
  const transaction = {
    id: randomUUID(),
    fromAccount: fromAccount ?? null,
    toAccount: toAccount ?? null,
    amount,
    currency,
    type,
    timestamp: new Date().toISOString(),
    // No real processing happens, so every valid transaction is completed at once
    status: 'completed',
  };
  transactions.push(transaction);
  return transaction;
}

const findAll = () => transactions;
const findById = (id) => transactions.find((t) => t.id === id);

module.exports = { TYPES, create, findAll, findById };
