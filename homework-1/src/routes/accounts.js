const express = require('express');
const Transaction = require('../models/transaction');
const { calculateBalances } = require('../utils/helpers');

const router = express.Router();

router.get('/:accountId/balance', (req, res) => {
  const { accountId } = req.params;
  const balances = calculateBalances(Transaction.findAll(), accountId);
  res.status(200).json({ accountId, balances });
});

module.exports = router;
