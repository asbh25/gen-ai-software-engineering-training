// Task 3 (filters), Task 4 option A (summary) and option C (CSV export)
const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const t = require('./helpers');
const { transactionsToCsv, escapeCell } = require('../src/utils/csv');

before(t.startServer);
after(t.stopServer);

// Four transactions with fixed timestamps around a month boundary
beforeEach(() => {
  t.Transaction.clear();
  const add = (data) => t.Transaction.seed({ currency: 'USD', ...data });
  add({ toAccount: 'ACC-12345', amount: 1000, type: 'deposit', timestamp: '2024-01-01T00:00:00.000Z' }); // #0
  add({ fromAccount: 'ACC-12345', toAccount: 'ACC-67890', amount: 100, type: 'transfer', timestamp: '2024-01-15T12:00:00.000Z' }); // #1
  add({ fromAccount: 'ACC-12345', amount: 50, type: 'withdrawal', timestamp: '2024-01-31T23:59:59.999Z' }); // #2
  add({ fromAccount: 'ACC-67890', toAccount: 'ACC-11111', amount: 10, type: 'transfer', timestamp: '2024-02-01T00:00:00.000Z' }); // #3
});

const amounts = (res) => res.body.map((x) => x.amount);

describe('GET /transactions filters (Task 3)', () => {
  it('without filters returns everything', async () => {
    assert.equal((await t.get('/transactions')).body.length, 4);
  });

  it('accountId matches sender or receiver', async () => {
    assert.deepEqual(amounts(await t.get('/transactions?accountId=ACC-12345')), [1000, 100, 50]);
    assert.deepEqual(amounts(await t.get('/transactions?accountId=ACC-67890')), [100, 10]);
    assert.deepEqual(amounts(await t.get('/transactions?accountId=ACC-11111')), [10]);
  });

  it('type filter', async () => {
    assert.deepEqual(amounts(await t.get('/transactions?type=transfer')), [100, 10]);
    assert.deepEqual(amounts(await t.get('/transactions?type=deposit')), [1000]);
  });

  it('date range is inclusive and a date-only "to" covers the whole day (UTC)', async () => {
    const january = await t.get('/transactions?from=2024-01-01&to=2024-01-31');
    assert.deepEqual(amounts(january), [1000, 100, 50], '23:59:59.999 on Jan 31 is included, Feb 1 00:00 is not');

    assert.deepEqual(amounts(await t.get('/transactions?from=2024-01-15&to=2024-01-15')), [100]);
    assert.deepEqual(amounts(await t.get('/transactions?from=2024-02-01')), [10]);
    assert.deepEqual(amounts(await t.get('/transactions?to=2024-01-01')), [1000]);
  });

  it('accepts ISO 8601 datetimes', async () => {
    const res = await t.get('/transactions?from=2024-01-15T12:00:00Z&to=2024-01-15T12:00:00Z');
    assert.deepEqual(amounts(res), [100]);
    const after = await t.get('/transactions?from=2024-01-15T12:00:00.001Z&to=2024-01-31T00:00:00Z');
    assert.deepEqual(amounts(after), []);
  });

  it('combines filters with AND', async () => {
    const res = await t.get('/transactions?accountId=ACC-12345&type=transfer&from=2024-01-01&to=2024-01-31');
    assert.deepEqual(amounts(res), [100]);
  });

  it('no match is 200 with []', async () => {
    const res = await t.get('/transactions?accountId=ACC-99999');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, []);
  });

  it('rejects invalid filters with 400 and reports all problems', async () => {
    const cases = {
      'type=gift': ['type'],
      'accountId=12345': ['accountId'],
      'from=yesterday': ['from'],
      'to=2024-02-30': ['to'],
      'from=01/01/2024': ['from'],
      'from=2024-02-01&to=2024-01-01': ['from'],
      'type=deposit&type=transfer': ['type'],
      'accountId=bad&type=gift&from=x&to=y': ['accountId', 'type', 'from', 'to'],
    };
    for (const [query, expected] of Object.entries(cases)) {
      const res = await t.get(`/transactions?${query}`);
      assert.equal(res.status, 400, query);
      assert.equal(res.body.error, 'Validation failed');
      assert.deepEqual(t.fields(res), expected, query);
    }
  });
});

describe('GET /accounts/:accountId/summary (Task 4, option A)', () => {
  it('returns totals, count and most recent date', async () => {
    const res = await t.get('/accounts/ACC-12345/summary');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, {
      accountId: 'ACC-12345',
      totalDeposits: { USD: 1000 },
      totalWithdrawals: { USD: 50 },
      transactionCount: 3,
      mostRecentTransactionDate: '2024-01-31T23:59:59.999Z',
    });
  });

  it('transfers count as transactions but not as deposits/withdrawals', async () => {
    const res = await t.get('/accounts/ACC-67890/summary');
    assert.deepEqual(res.body.totalDeposits, {});
    assert.deepEqual(res.body.totalWithdrawals, {});
    assert.equal(res.body.transactionCount, 2);
    assert.equal(res.body.mostRecentTransactionDate, '2024-02-01T00:00:00.000Z');
  });

  it('keeps currencies apart and ignores failed/pending in the totals', async () => {
    t.Transaction.seed({ toAccount: 'ACC-12345', amount: 20, currency: 'EUR', type: 'deposit', timestamp: '2024-03-01T00:00:00.000Z' });
    t.Transaction.seed({ toAccount: 'ACC-12345', amount: 999, currency: 'USD', type: 'deposit', timestamp: '2024-03-02T00:00:00.000Z', status: 'pending' });
    t.Transaction.seed({ fromAccount: 'ACC-12345', amount: 999, currency: 'USD', type: 'withdrawal', timestamp: '2024-03-03T00:00:00.000Z', status: 'failed' });
    const { body } = await t.get('/accounts/ACC-12345/summary');
    assert.deepEqual(body.totalDeposits, { USD: 1000, EUR: 20 });
    assert.deepEqual(body.totalWithdrawals, { USD: 50 });
    assert.equal(body.transactionCount, 6, 'failed and pending attempts are still counted');
    assert.equal(body.mostRecentTransactionDate, '2024-03-03T00:00:00.000Z');
  });

  it('an account without transactions has an empty summary', async () => {
    const res = await t.get('/accounts/ACC-00000/summary');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, {
      accountId: 'ACC-00000',
      totalDeposits: {},
      totalWithdrawals: {},
      transactionCount: 0,
      mostRecentTransactionDate: null,
    });
  });
});

describe('GET /transactions/export (Task 4, option C)', () => {
  const HEADER = 'id,fromAccount,toAccount,amount,currency,type,timestamp,status,failureReason';

  it('returns CSV with a header row and download headers', async () => {
    const res = await t.get('/transactions/export?format=csv');
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type'), /^text\/csv/);
    assert.match(res.headers.get('content-disposition'), /attachment; filename="transactions\.csv"/);

    const lines = res.body.trim().split('\r\n');
    assert.equal(lines[0], HEADER);
    assert.equal(lines.length, 5, 'header + 4 transactions');
    assert.match(lines[1], /^[0-9a-f-]{36},,ACC-12345,1000,USD,deposit,2024-01-01T00:00:00\.000Z,completed,$/);
  });

  it('format is optional and defaults to csv', async () => {
    const res = await t.get('/transactions/export');
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type'), /^text\/csv/);
  });

  it('supports the same filters as the list', async () => {
    const res = await t.get('/transactions/export?type=transfer&accountId=ACC-11111');
    const lines = res.body.trim().split('\r\n');
    assert.equal(lines.length, 2);
    assert.match(lines[1], /ACC-67890,ACC-11111,10,USD,transfer/);
  });

  it('no match returns only the header row', async () => {
    const res = await t.get('/transactions/export?accountId=ACC-99999');
    assert.equal(res.body, HEADER + '\r\n');
  });

  it('includes the failure reason of failed transactions', async () => {
    t.Transaction.clear();
    await t.withdraw('ACC-12345', 10);
    const lines = (await t.get('/transactions/export')).body.trim().split('\r\n');
    assert.match(lines[1], /,withdrawal,.*,failed,"Insufficient funds: available 0 USD, requested 10 USD"$/);
  });

  it('rejects other formats and invalid filters with 400 (all errors together)', async () => {
    const xml = await t.get('/transactions/export?format=xml');
    assert.equal(xml.status, 400);
    assert.deepEqual(t.fields(xml), ['format']);

    const both = await t.get('/transactions/export?format=xml&type=gift');
    assert.deepEqual(t.fields(both), ['format', 'type']);
  });

  it('"export" is not mistaken for a transaction id', async () => {
    const res = await t.get('/transactions/export');
    assert.notEqual(res.status, 404);
    assert.equal((await t.get('/transactions/not-an-id')).status, 404);
  });

  it('escapes commas, quotes and line breaks (RFC 4180)', () => {
    assert.equal(escapeCell('plain'), 'plain');
    assert.equal(escapeCell(null), '');
    assert.equal(escapeCell('a,b'), '"a,b"');
    assert.equal(escapeCell('say "hi"'), '"say ""hi"""');
    assert.equal(escapeCell('two\nlines'), '"two\nlines"');
    const csv = transactionsToCsv([{ id: '1', toAccount: 'a,b', amount: 1, currency: 'USD', type: 'x"y', timestamp: 't', status: 's' }]);
    assert.equal(csv.split('\r\n')[1], '1,,"a,b",1,USD,"x""y",t,s,');
  });
});
