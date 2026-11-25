const express = require('express');
const Transaction = require('../models/transaction');
const { calculateBalances, calculateSummary } = require('../utils/helpers');

const router = express.Router();

router.get('/:accountId/balance', (req, res) => {
  const { accountId } = req.params;
  const balances = calculateBalances(Transaction.findAll(), accountId);
  res.status(200).json({ accountId, balances });
});

router.get('/:accountId/summary', (req, res) => {
  const { accountId } = req.params;
  res.status(200).json(calculateSummary(Transaction.findAll(), accountId));
});

module.exports = router;
