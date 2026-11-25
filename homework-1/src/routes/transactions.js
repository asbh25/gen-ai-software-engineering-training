const express = require('express');
const Transaction = require('../models/transaction');
const { validateTransaction } = require('../validators/transactionValidator');
const { validateFilters } = require('../validators/filterValidator');
const { filterTransactions } = require('../utils/helpers');

const router = express.Router();

router.post('/', (req, res) => {
  const details = validateTransaction(req.body);
  if (details.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details });
  }
  res.status(201).json(Transaction.create(req.body));
});

// Supports ?accountId=&type=&from=&to= (all optional, combined with AND)
router.get('/', (req, res) => {
  const { details, filters } = validateFilters(req.query);
  if (details.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details });
  }
  res.status(200).json(filterTransactions(Transaction.findAll(), filters));
});

router.get('/:id', (req, res) => {
  const transaction = Transaction.findById(req.params.id);
  if (!transaction) {
    return res.status(404).json({ error: 'Transaction not found' });
  }
  res.status(200).json(transaction);
});

module.exports = router;
