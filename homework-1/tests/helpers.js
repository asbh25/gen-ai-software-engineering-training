// Shared test helpers: starts the real Express app on a random free port,
// so tests never clash with a server you are running on port 3000.
const app = require('../src/app');
const Transaction = require('../src/models/transaction');

let server;
let baseUrl;

async function startServer() {
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  baseUrl = `http://localhost:${server.address().port}`;
}

async function stopServer() {
  await new Promise((resolve) => server.close(resolve));
}

// Sends a request and returns { status, body (parsed JSON or raw text), headers }.
async function request(method, path, body) {
  const options = { method, headers: {} };
  if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  const res = await fetch(baseUrl + path, options);
  const text = await res.text();
  let parsed = text;
  try {
    parsed = JSON.parse(text);
  } catch {
    // not JSON (e.g. CSV) - keep the raw text
  }
  return { status: res.status, body: parsed, headers: res.headers };
}

const get = (path) => request('GET', path);
const post = (path, body) => request('POST', path, body);

const deposit = (toAccount, amount, currency = 'USD') =>
  post('/transactions', { toAccount, amount, currency, type: 'deposit' });
const withdraw = (fromAccount, amount, currency = 'USD') =>
  post('/transactions', { fromAccount, amount, currency, type: 'withdrawal' });
const transfer = (fromAccount, toAccount, amount, currency = 'USD') =>
  post('/transactions', { fromAccount, toAccount, amount, currency, type: 'transfer' });

const fields = (res) => res.body.details.map((d) => d.field);

module.exports = {
  Transaction,
  startServer,
  stopServer,
  request,
  get,
  post,
  deposit,
  withdraw,
  transfer,
  fields,
};
