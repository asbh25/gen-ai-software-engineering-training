const COLUMNS = ['id', 'fromAccount', 'toAccount', 'amount', 'currency', 'type', 'timestamp', 'status'];

// RFC 4180 escaping: wrap in quotes if the value has a comma, quote or line break.
function escapeCell(value) {
  if (value === null || value === undefined) return '';
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function transactionsToCsv(transactions) {
  const rows = transactions.map((t) => COLUMNS.map((c) => escapeCell(t[c])).join(','));
  return [COLUMNS.join(','), ...rows].join('\r\n') + '\r\n';
}

module.exports = { transactionsToCsv, escapeCell };
