const express = require('express');
const transactionsRouter = require('./routes/transactions');
const accountsRouter = require('./routes/accounts');

const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/transactions', transactionsRouter);
app.use('/accounts', accountsRouter);

// Invalid JSON body -> 400
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Unknown route -> 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

module.exports = app;
