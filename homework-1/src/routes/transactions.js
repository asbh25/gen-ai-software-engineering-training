const express = require('express');
const Transaction = require('../models/transaction');
const { validateTransaction } = require('../validators/transactionValidator');
const { validateFilters } = require('../validators/filterValidator');
const { filterTransactions, checkFunds } = require('../utils/helpers');
const { transactionsToCsv } = require('../utils/csv');

const router = express.Router();

router.post('/', (req, res) => {
  const details = validateTransaction(req.body);
  if (details.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details });
  }
  // Business rule: balances never go negative. An overdraft is still recorded,
  // but as a `failed` transaction with a reason (and it does not change any balance).
  const funds = checkFunds(Transaction.findAll(), req.body);
  const outcome = funds.ok ? {} : { status: 'failed', failureReason: funds.reason };
  res.status(201).json(Transaction.create(req.body, outcome));
});

// Supports ?accountId=&type=&from=&to= (all optional, combined with AND)
router.get('/', (req, res) => {
  const { details, filters } = validateFilters(req.query);
  if (details.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details });
  }
  res.status(200).json(filterTransactions(Transaction.findAll(), filters));
});

// Export as CSV. Must be registered BEFORE '/:id', otherwise "export" is treated as an id.
// Accepts the same filters as the list endpoint (?accountId=&type=&from=&to=).
router.get('/export', (req, res) => {
  const { format = 'csv', ...query } = req.query;
  const { details, filters } = validateFilters(query);
  if (format !== 'csv') {
    details.unshift({ field: 'format', message: 'Unsupported format. Only "csv" is supported' });
  }
  if (details.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details });
  }
  const csv = transactionsToCsv(filterTransactions(Transaction.findAll(), filters));
  res
    .status(200)
    .set('Content-Type', 'text/csv; charset=utf-8')
    .set('Content-Disposition', 'attachment; filename="transactions.csv"')
    .send(csv);
});

router.get('/:id', (req, res) => {
  const transaction = Transaction.findById(req.params.id);
  if (!transaction) {
    return res.status(404).json({ error: 'Transaction not found' });
  }
  res.status(200).json(transaction);
});

module.exports = router;
