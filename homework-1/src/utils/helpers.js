// Balance per currency, counting only completed transactions.
//   deposit    -> +amount to toAccount
//   withdrawal -> -amount from fromAccount
//   transfer   -> -amount from fromAccount, +amount to toAccount
function calculateBalances(transactions, accountId) {
  const balances = {};
  const apply = (currency, delta) => {
    // round to 2 decimals to avoid floating point drift (0.1 + 0.2)
    balances[currency] = Math.round(((balances[currency] || 0) + delta) * 100) / 100;
  };

  for (const t of transactions) {
    if (t.status !== 'completed') continue;
    if (t.toAccount === accountId && (t.type === 'deposit' || t.type === 'transfer')) {
      apply(t.currency, t.amount);
    }
    if (t.fromAccount === accountId && (t.type === 'withdrawal' || t.type === 'transfer')) {
      apply(t.currency, -t.amount);
    }
  }
  return balances;
}

module.exports = { calculateBalances };

// Applies all given filters together (AND). Missing filters are ignored.
function filterTransactions(transactions, { accountId, type, from, to }) {
  return transactions.filter((t) => {
    if (accountId && t.fromAccount !== accountId && t.toAccount !== accountId) return false;
    if (type && t.type !== type) return false;
    const time = Date.parse(t.timestamp);
    if (from !== undefined && time < from) return false;
    if (to !== undefined && time > to) return false;
    return true;
  });
}

module.exports.filterTransactions = filterTransactions;
