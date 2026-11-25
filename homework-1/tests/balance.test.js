// Balance, the "balance can never go negative" rule, and the failed transactions it produces
const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const t = require('./helpers');

before(t.startServer);
after(t.stopServer);
beforeEach(() => t.Transaction.clear());

const balance = async (account) => (await t.get(`/accounts/${account}/balance`)).body.balances;

describe('GET /accounts/:accountId/balance', () => {
  it('applies deposits, withdrawals and transfers', async () => {
    await t.deposit('ACC-12345', 500);
    await t.transfer('ACC-12345', 'ACC-67890', 100.5);
    await t.withdraw('ACC-12345', 50);
    assert.deepEqual(await balance('ACC-12345'), { USD: 349.5 });
    assert.deepEqual(await balance('ACC-67890'), { USD: 100.5 });
  });

  it('keeps currencies apart', async () => {
    await t.deposit('ACC-12345', 100, 'USD');
    await t.deposit('ACC-12345', 20, 'EUR');
    assert.deepEqual(await balance('ACC-12345'), { USD: 100, EUR: 20 });
  });

  it('avoids floating point drift (0.1 + 0.2)', async () => {
    await t.deposit('ACC-12345', 0.1);
    await t.deposit('ACC-12345', 0.2);
    assert.deepEqual(await balance('ACC-12345'), { USD: 0.3 });
  });

  it('returns 200 with empty balances for an unknown account', async () => {
    const res = await t.get('/accounts/ACC-00000/balance');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { accountId: 'ACC-00000', balances: {} });
  });
});

describe('Rule: a balance can never go negative', () => {
  it('a withdrawal from an empty account fails (and is recorded as failed)', async () => {
    const res = await t.withdraw('ACC-12345', 10);
    assert.equal(res.status, 201);
    assert.equal(res.body.status, 'failed');
    assert.equal(res.body.failureReason, 'Insufficient funds: available 0 USD, requested 10 USD');
    assert.deepEqual(await balance('ACC-12345'), {});
  });

  it('a withdrawal larger than the balance fails and changes nothing', async () => {
    await t.deposit('ACC-12345', 100);
    const res = await t.withdraw('ACC-12345', 100.01);
    assert.equal(res.body.status, 'failed');
    assert.match(res.body.failureReason, /available 100 USD, requested 100.01 USD/);
    assert.deepEqual(await balance('ACC-12345'), { USD: 100 });
  });

  it('a transfer larger than the balance fails; the receiver gets nothing', async () => {
    await t.deposit('ACC-12345', 50);
    const res = await t.transfer('ACC-12345', 'ACC-67890', 50.01);
    assert.equal(res.body.status, 'failed');
    assert.deepEqual(await balance('ACC-12345'), { USD: 50 });
    assert.deepEqual(await balance('ACC-67890'), {});
  });

  it('spending exactly the whole balance is allowed (balance becomes 0)', async () => {
    await t.deposit('ACC-12345', 75.25);
    const res = await t.withdraw('ACC-12345', 75.25);
    assert.equal(res.body.status, 'completed');
    assert.deepEqual(await balance('ACC-12345'), { USD: 0 });

    const next = await t.withdraw('ACC-12345', 0.01);
    assert.equal(next.body.status, 'failed');
  });

  it('is checked per currency: USD funds cannot pay a EUR withdrawal', async () => {
    await t.deposit('ACC-12345', 1000, 'USD');
    const res = await t.withdraw('ACC-12345', 1, 'EUR');
    assert.equal(res.body.status, 'failed');
    assert.match(res.body.failureReason, /available 0 EUR/);
  });

  it('uses the up-to-date balance: money received in a transfer can be spent', async () => {
    await t.deposit('ACC-12345', 100);
    await t.transfer('ACC-12345', 'ACC-67890', 100);
    assert.equal((await t.withdraw('ACC-67890', 100)).body.status, 'completed');
    assert.equal((await t.withdraw('ACC-12345', 1)).body.status, 'failed');
  });

  it('deposits never fail', async () => {
    const res = await t.deposit('ACC-12345', 1000000);
    assert.equal(res.body.status, 'completed');
    assert.equal(res.body.failureReason, undefined);
  });

  it('failed transactions are stored, listed and can be fetched by id', async () => {
    const failed = (await t.withdraw('ACC-12345', 10)).body;
    const found = await t.get(`/transactions/${failed.id}`);
    assert.equal(found.status, 200);
    assert.equal(found.body.status, 'failed');
    assert.equal((await t.get('/transactions')).body.length, 1);
  });

  it('failed and pending transactions never count towards a balance', async () => {
    t.Transaction.seed({ toAccount: 'ACC-12345', amount: 100, currency: 'USD', type: 'deposit', timestamp: '2024-01-01T00:00:00.000Z' });
    t.Transaction.seed({ toAccount: 'ACC-12345', amount: 900, currency: 'USD', type: 'deposit', timestamp: '2024-01-02T00:00:00.000Z', status: 'pending' });
    t.Transaction.seed({ toAccount: 'ACC-12345', amount: 900, currency: 'USD', type: 'deposit', timestamp: '2024-01-03T00:00:00.000Z', status: 'failed' });
    assert.deepEqual(await balance('ACC-12345'), { USD: 100 });
    // the pending 900 cannot be spent either
    assert.equal((await t.withdraw('ACC-12345', 101)).body.status, 'failed');
  });

  it('the balance is never negative after a mixed series of operations', async () => {
    await t.deposit('ACC-12345', 100);
    for (const amount of [30, 30, 30, 30, 30]) await t.withdraw('ACC-12345', amount);
    await t.transfer('ACC-12345', 'ACC-67890', 25);
    const usd = (await balance('ACC-12345')).USD;
    assert.ok(usd >= 0, `balance ${usd} must not be negative`);
    assert.equal(usd, 10);
  });
});
