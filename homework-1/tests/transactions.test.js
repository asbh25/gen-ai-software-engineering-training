// Task 1 (core API) and Task 2 (validation)
const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const t = require('./helpers');

before(t.startServer);
after(t.stopServer);
beforeEach(() => t.Transaction.clear());

describe('POST /transactions', () => {
  it('creates a deposit and sets id, timestamp and status', async () => {
    const res = await t.deposit('ACC-12345', 500);
    assert.equal(res.status, 201);
    assert.match(res.body.id, /^[0-9a-f-]{36}$/);
    assert.equal(res.body.status, 'completed');
    assert.equal(res.body.fromAccount, null);
    assert.equal(res.body.toAccount, 'ACC-12345');
    assert.ok(!Number.isNaN(Date.parse(res.body.timestamp)));
  });

  it('ignores client-supplied id, timestamp and status', async () => {
    const res = await t.post('/transactions', {
      toAccount: 'ACC-12345',
      amount: 5,
      currency: 'USD',
      type: 'deposit',
      id: 'my-own-id',
      timestamp: '2000-01-01T00:00:00.000Z',
      status: 'failed',
    });
    assert.equal(res.status, 201);
    assert.notEqual(res.body.id, 'my-own-id');
    assert.notEqual(res.body.timestamp, '2000-01-01T00:00:00.000Z');
    assert.equal(res.body.status, 'completed');
  });

  it('creates a transfer and a withdrawal when funds are available', async () => {
    await t.deposit('ACC-12345', 500);
    const tr = await t.transfer('ACC-12345', 'ACC-67890', 100.5);
    const wd = await t.withdraw('ACC-12345', 50);
    assert.equal(tr.status, 201);
    assert.equal(tr.body.status, 'completed');
    assert.equal(wd.status, 201);
    assert.equal(wd.body.status, 'completed');
    assert.equal(wd.body.toAccount, null);
  });

  it('returns 400 for malformed JSON and for a non-object body', async () => {
    const bad = await t.post('/transactions', '{bad json');
    assert.equal(bad.status, 400);
    assert.equal(bad.body.error, 'Invalid JSON body');

    const arr = await t.post('/transactions', '[]');
    assert.equal(arr.status, 400);
    assert.deepEqual(t.fields(arr), ['body']);
  });
});

describe('GET /transactions and /transactions/:id', () => {
  it('lists all transactions (empty list is [])', async () => {
    assert.deepEqual((await t.get('/transactions')).body, []);
    await t.deposit('ACC-12345', 1);
    await t.deposit('ACC-12345', 2);
    const res = await t.get('/transactions');
    assert.equal(res.status, 200);
    assert.equal(res.body.length, 2);
  });

  it('gets one transaction by id, 404 when unknown', async () => {
    const created = (await t.deposit('ACC-12345', 10)).body;
    const found = await t.get(`/transactions/${created.id}`);
    assert.equal(found.status, 200);
    assert.deepEqual(found.body, created);

    const missing = await t.get('/transactions/does-not-exist');
    assert.equal(missing.status, 404);
    assert.equal(missing.body.error, 'Transaction not found');
  });

  it('returns 404 for unknown routes', async () => {
    const res = await t.get('/nope');
    assert.equal(res.status, 404);
  });
});

describe('Validation (Task 2)', () => {
  const valid = { toAccount: 'ACC-12345', amount: 10, currency: 'USD', type: 'deposit' };
  const send = (changes) => t.post('/transactions', { ...valid, ...changes });

  it('accepts a valid body', async () => {
    assert.equal((await send({})).status, 201);
  });

  it('amount must be a positive number', async () => {
    for (const amount of [0, -5, '10', 'abc', null, undefined, NaN]) {
      const res = await send({ amount });
      assert.equal(res.status, 400, `amount ${String(amount)} should be rejected`);
      assert.deepEqual(t.fields(res), ['amount']);
    }
  });

  it('amount allows at most 2 decimal places', async () => {
    for (const amount of [100.5, 0.29, 0.01, 19.99, 1234567.89]) {
      assert.equal((await send({ amount })).status, 201, `${amount} should pass`);
    }
    for (const amount of [100.555, 1.005, 0.001, 1234567.891, 2.675]) {
      const res = await send({ amount });
      assert.equal(res.status, 400, `${amount} should fail`);
      assert.match(res.body.details[0].message, /2 decimal places/);
    }
  });

  it('accounts must look like ACC-XXXXX (5 letters or digits)', async () => {
    for (const toAccount of ['ACC-12345', 'ACC-AB12Z', 'ACC-abcde']) {
      assert.equal((await send({ toAccount })).status, 201, `${toAccount} should pass`);
    }
    for (const toAccount of ['ACC-1234', 'ACC-123456', 'ACC-12#45', 'acc-12345', '12345', '', 42]) {
      const res = await send({ toAccount });
      assert.equal(res.status, 400, `${String(toAccount)} should fail`);
      assert.deepEqual(t.fields(res), ['toAccount']);
    }
  });

  it('an optional account is still format-checked when it is sent', async () => {
    const res = await send({ fromAccount: 'BAD' });
    assert.equal(res.status, 400);
    assert.deepEqual(t.fields(res), ['fromAccount']);
  });

  it('currency must be an uppercase ISO 4217 code', async () => {
    for (const currency of ['USD', 'EUR', 'GBP', 'JPY', 'UAH', 'PLN']) {
      assert.equal((await send({ currency })).status, 201, `${currency} should pass`);
    }
    for (const currency of ['XXX', 'usd', 'DOLLAR', 'US', 123, '']) {
      const res = await send({ currency });
      assert.equal(res.status, 400, `${String(currency)} should fail`);
      assert.deepEqual(t.fields(res), ['currency']);
    }
    const missing = await t.post('/transactions', { toAccount: 'ACC-12345', amount: 1, type: 'deposit' });
    assert.equal(missing.status, 400);
    assert.equal(missing.body.details[0].message, 'Currency is required');
  });

  it('type must be deposit, withdrawal or transfer', async () => {
    const res = await send({ type: 'gift' });
    assert.equal(res.status, 400);
    assert.ok(t.fields(res).includes('type'));
  });

  it('requires the right accounts for each type', async () => {
    const noTo = await t.post('/transactions', { amount: 5, currency: 'USD', type: 'deposit' });
    assert.deepEqual(t.fields(noTo), ['toAccount']);

    const noFrom = await t.post('/transactions', { amount: 5, currency: 'USD', type: 'withdrawal' });
    assert.deepEqual(t.fields(noFrom), ['fromAccount']);

    const noBoth = await t.post('/transactions', { amount: 5, currency: 'USD', type: 'transfer' });
    assert.deepEqual(t.fields(noBoth).sort(), ['fromAccount', 'toAccount']);

    const same = await t.transfer('ACC-12345', 'ACC-12345', 5);
    assert.equal(same.status, 400);
    assert.match(same.body.details[0].message, /must differ/);
  });

  it('reports all problems at once, in the documented format', async () => {
    const res = await t.post('/transactions', {
      fromAccount: 'x',
      toAccount: 'y',
      amount: -1.234,
      currency: 'ZZZ',
      type: 'transfer',
    });
    assert.equal(res.status, 400);
    assert.equal(res.body.error, 'Validation failed');
    assert.deepEqual(t.fields(res), ['amount', 'currency', 'fromAccount', 'toAccount']);
    for (const d of res.body.details) {
      assert.equal(typeof d.field, 'string');
      assert.equal(typeof d.message, 'string');
    }
    assert.equal(t.Transaction.findAll().length, 0, 'nothing is stored for an invalid request');
  });
});
