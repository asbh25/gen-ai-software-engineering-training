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
