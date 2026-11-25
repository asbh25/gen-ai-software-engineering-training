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

// Summary of one account. Money totals are per currency (like balances).
//   totalDeposits    -> deposits received by the account
//   totalWithdrawals -> withdrawals made from the account
//   transactionCount -> every transaction involving the account (any type)
//   mostRecentTransactionDate -> latest timestamp, or null when there are none
function calculateSummary(transactions, accountId) {
  const related = transactions.filter(
    (t) => t.fromAccount === accountId || t.toAccount === accountId
  );
  const totalDeposits = {};
  const totalWithdrawals = {};
  const add = (target, currency, amount) => {
    target[currency] = Math.round(((target[currency] || 0) + amount) * 100) / 100;
  };

  let mostRecent = null;
  for (const t of related) {
    if (mostRecent === null || Date.parse(t.timestamp) > Date.parse(mostRecent)) {
      mostRecent = t.timestamp;
    }
    if (t.status !== 'completed') continue;
    if (t.type === 'deposit' && t.toAccount === accountId) add(totalDeposits, t.currency, t.amount);
    if (t.type === 'withdrawal' && t.fromAccount === accountId) add(totalWithdrawals, t.currency, t.amount);
  }

  return {
    accountId,
    totalDeposits,
    totalWithdrawals,
    transactionCount: related.length,
    mostRecentTransactionDate: mostRecent,
  };
}

module.exports.calculateSummary = calculateSummary;
