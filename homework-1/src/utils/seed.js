const fs = require('fs');
const path = require('path');
const Transaction = require('../models/transaction');
const { validateTransaction } = require('../validators/transactionValidator');

const DEFAULT_FILE = path.join(__dirname, '..', '..', 'demo', 'sample-data.json');
const STATUSES = ['pending', 'completed', 'failed'];

// Loads demo/sample-data.json into the in-memory store. Every entry goes through the
// same validation as POST /transactions; invalid entries are skipped with a warning.
function loadSampleData(file = process.env.SAMPLE_DATA_FILE || DEFAULT_FILE) {
  const items = JSON.parse(fs.readFileSync(file, 'utf8'));
  let loaded = 0;

  items.forEach((item, index) => {
    const problems = validateTransaction(item).map((d) => `${d.field}: ${d.message}`);
    if (Number.isNaN(Date.parse(item.timestamp))) problems.push('timestamp: invalid date');
    if (item.status !== undefined && !STATUSES.includes(item.status)) problems.push('status: invalid');

    if (problems.length > 0) {
      console.warn(`Skipping sample transaction #${index + 1}: ${problems.join('; ')}`);
      return;
    }
    Transaction.seed(item);
    loaded += 1;
  });

  return loaded;
}

module.exports = { loadSampleData };
