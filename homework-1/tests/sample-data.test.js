// demo/sample-data.json must be loadable and consistent with the business rules,
// and the numbers quoted in HOWTORUN.md must be true.
const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const t = require('./helpers');
const { loadSampleData } = require('../src/utils/seed');
const { calculateBalances } = require('../src/utils/helpers');

const FILE = path.join(__dirname, '..', 'demo', 'sample-data.json');
const raw = JSON.parse(fs.readFileSync(FILE, 'utf8'));

before(t.startServer);
after(t.stopServer);
beforeEach(() => t.Transaction.clear());

describe('demo/sample-data.json', () => {
  it('loads every entry (all pass validation)', () => {
    assert.equal(loadSampleData(FILE), raw.length);
    assert.equal(t.Transaction.findAll().length, 16);
  });

  it('replayed in time order, no completed transaction ever overdraws and every failed one really would have', () => {
    const ordered = [...raw].sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
    const history = [];

    for (const item of ordered) {
      const status = item.status ?? 'completed';
      if (status === 'completed' && item.type !== 'deposit') {
        const available = calculateBalances(history, item.fromAccount)[item.currency] || 0;
        assert.ok(
          Math.round((available - item.amount) * 100) >= 0,
          `${item.timestamp}: completed ${item.type} of ${item.amount} ${item.currency} would overdraw ${item.fromAccount} (available ${available})`
        );
      }
      if (status === 'failed') {
        const available = calculateBalances(history, item.fromAccount)[item.currency] || 0;
        assert.ok(
          Math.round((available - item.amount) * 100) < 0,
          `${item.timestamp}: failed ${item.type} of ${item.amount} ${item.currency} would actually have been allowed (available ${available})`
        );
        assert.ok(item.failureReason, 'failed transactions explain why');
      }
      history.push({ status, ...item });
    }
  });

  it('final balances are never negative and match the documented values', async () => {
    loadSampleData(FILE);
    const balance = async (a) => (await t.get(`/accounts/${a}/balance`)).body.balances;
    assert.deepEqual(await balance('ACC-12345'), { USD: 924.75, JPY: 15000 });
    assert.deepEqual(await balance('ACC-67890'), { USD: 555.25 });
    assert.deepEqual(await balance('ACC-ABCDE'), { EUR: 250, USD: 0 });
  });

  it('contains the statuses it is meant to demo', () => {
    loadSampleData(FILE);
    const count = (s) => t.Transaction.findAll().filter((x) => x.status === s).length;
    assert.equal(count('completed'), 11);
    assert.equal(count('failed'), 4);
    assert.equal(count('pending'), 1);
  });

  it('matches the expected results quoted in HOWTORUN.md', async () => {
    loadSampleData(FILE);
    const len = async (q) => (await t.get(`/transactions${q}`)).body.length;
    assert.equal(await len(''), 16);
    assert.equal(await len('?from=2024-01-01&to=2024-01-31'), 9);
    assert.equal(await len('?type=transfer'), 5);
    assert.equal(await len('?accountId=ACC-12345&type=transfer&from=2024-01-01&to=2024-01-31'), 2);

    const summary = (await t.get('/accounts/ACC-12345/summary')).body;
    assert.deepEqual(summary.totalDeposits, { USD: 1200, JPY: 15000 });
    assert.deepEqual(summary.totalWithdrawals, { USD: 100 });
    assert.equal(summary.transactionCount, 10);
    assert.equal(summary.mostRecentTransactionDate, '2024-02-14T12:00:00.000Z');
  });

  it('skips invalid entries instead of loading them', () => {
    const tmp = path.join(require('os').tmpdir(), `hw1-bad-sample-${process.pid}.json`);
    fs.writeFileSync(tmp, JSON.stringify([
      { toAccount: 'ACC-12345', amount: 5, currency: 'USD', type: 'deposit', timestamp: '2024-01-01T00:00:00Z' },
      { toAccount: 'nope', amount: -1, currency: 'USD', type: 'deposit', timestamp: '2024-01-01T00:00:00Z' },
      { toAccount: 'ACC-12345', amount: 5, currency: 'USD', type: 'deposit', timestamp: 'not-a-date' },
    ]));
    const warn = console.warn;
    console.warn = () => {};
    try {
      assert.equal(loadSampleData(tmp), 1);
    } finally {
      console.warn = warn;
      fs.unlinkSync(tmp);
    }
  });
});
