# 🏦 Homework 1: Banking Transactions API

> **Student Name**: [Your Name]
> **Date Submitted**: [Date]
> **AI Tools Used**: Claude Code (Claude Opus 5.5 / Sonnet 5.5)

---

## 📋 Project Overview

A minimal REST API for banking transactions built with **Node.js + Express**, using in-memory storage (no database). Data is lost when the server restarts.

> 🚧 **Work in progress.** Currently implemented: **Task 1 (core API)** with basic validation. Still to do: full validation (Task 2), filtering (Task 3), and an additional feature (Task 4).

### Endpoints

| Method | Endpoint | Description | Status codes |
|--------|----------|-------------|--------------|
| `POST` | `/transactions` | Create a new transaction | 201, 400 |
| `GET` | `/transactions` | List all transactions | 200 |
| `GET` | `/transactions/:id` | Get one transaction by ID | 200, 404 |
| `GET` | `/accounts/:accountId/balance` | Get account balance | 200 |
| `GET` | `/health` | Health check | 200 |

Unknown routes return `404`; malformed JSON bodies return `400`; unexpected errors return `500`.

### Project structure

```
src/
├── index.js                          # starts the server (port 3000)
├── app.js                            # Express app, routers, error handlers
├── routes/
│   ├── transactions.js               # /transactions endpoints
│   └── accounts.js                   # /accounts/:accountId/balance
├── models/transaction.js             # in-memory storage + create/find
├── validators/transactionValidator.js
└── utils/helpers.js                  # balance calculation
```

---

## 🧠 Design Decisions

| Topic | Decision | Why |
|-------|----------|-----|
| **Storage** | In-memory array | Required by the task; simplest option. |
| **Transaction ID** | UUID (`crypto.randomUUID`) | Unique without a counter or database. |
| **Timestamp** | Set by the server in ISO 8601 | Clients can't forge it. |
| **Status** | Every valid transaction is saved as `completed` | No real processing happens, so `pending`/`failed` are never produced yet. |
| **Required accounts** | `deposit` needs `toAccount`; `withdrawal` needs `fromAccount`; `transfer` needs both and they must differ | Each type involves different accounts. Missing accounts are stored as `null`. |
| **Balance rules** | Only `completed` transactions count. Deposit → `+amount` to `toAccount`; withdrawal → `−amount` from `fromAccount`; transfer → `−amount` from `fromAccount` and `+amount` to `toAccount` | Standard bookkeeping. |
| **Balance per currency** | Response is `{ "accountId": "...", "balances": { "USD": 399.4, "EUR": 20 } }` | USD and EUR can't be added together, so each currency is tracked separately. |
| **Unknown account balance** | `200` with `"balances": {}` | Accounts aren't created explicitly, so an account with no transactions simply has no balance. |
| **Overdraft** | Not checked; a balance can go negative | Not required by the task. |
| **Rounding** | Balances are rounded to 2 decimals | Avoids floating-point drift such as `0.1 + 0.2`. |
| **Validation errors** | All errors collected and returned as `{ "error": "Validation failed", "details": [{ "field", "message" }] }` | Matches the format in `TASKS.md`. |

### Current validation (basic)

- `amount` must be a number greater than 0
- `currency` must be a non-empty string
- `type` must be `deposit`, `withdrawal` or `transfer`
- Required accounts per type (see above)

*Not yet validated (Task 2): max 2 decimal places, `ACC-XXXXX` account format, ISO 4217 currency codes.*

---

## 🧪 Example Requests

Start the server first (`npm start`), then run these in a second terminal. The server runs at `http://localhost:3000`.

### 1. Create a transaction — `POST /transactions`

**Deposit** (needs `toAccount`):
```bash
curl -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "toAccount": "ACC-12345",
    "amount": 500,
    "currency": "USD",
    "type": "deposit"
  }'
```

**Transfer** (needs `fromAccount` and `toAccount`):
```bash
curl -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "fromAccount": "ACC-12345",
    "toAccount": "ACC-67890",
    "amount": 100.50,
    "currency": "USD",
    "type": "transfer"
  }'
```

**Withdrawal** (needs `fromAccount`):
```bash
curl -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "fromAccount": "ACC-12345",
    "amount": 50,
    "currency": "USD",
    "type": "withdrawal"
  }'
```

Response — `201 Created`:
```json
{
  "id": "7d08143f-0bc6-483f-971d-7aecf717087b",
  "fromAccount": "ACC-12345",
  "toAccount": "ACC-67890",
  "amount": 100.5,
  "currency": "USD",
  "type": "transfer",
  "timestamp": "2026-11-25T10:23:55.736Z",
  "status": "completed"
}
```

### 2. List all transactions — `GET /transactions`

```bash
curl http://localhost:3000/transactions
```
Response — `200 OK`: an array of transactions (empty array `[]` if none yet).

### 3. Get one transaction — `GET /transactions/:id`

Replace `<id>` with an `id` from a previous response:
```bash
curl http://localhost:3000/transactions/<id>
```
Response — `200 OK` with the transaction, or `404`:
```json
{ "error": "Transaction not found" }
```

Not-found example:
```bash
curl -i http://localhost:3000/transactions/does-not-exist
```

### 4. Get account balance — `GET /accounts/:accountId/balance`

```bash
curl http://localhost:3000/accounts/ACC-12345/balance
```
Response — `200 OK` (after the deposit, transfer and withdrawal above):
```json
{
  "accountId": "ACC-12345",
  "balances": { "USD": 349.5 }
}
```

### 5. Error examples

**Invalid amount and type** → `400`:
```bash
curl -i -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -d '{"toAccount": "ACC-12345", "amount": -5, "currency": "USD", "type": "gift"}'
```
```json
{
  "error": "Validation failed",
  "details": [
    { "field": "amount", "message": "Amount must be a positive number" },
    { "field": "type", "message": "Type must be one of: deposit, withdrawal, transfer" }
  ]
}
```

**Transfer missing `fromAccount`** → `400`:
```bash
curl -i -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -d '{"toAccount": "ACC-12345", "amount": 5, "currency": "USD", "type": "transfer"}'
```

**Malformed JSON** → `400 {"error": "Invalid JSON body"}`:
```bash
curl -i -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -d '{bad json'
```

**Unknown route** → `404 {"error": "Not found"}`:
```bash
curl -i http://localhost:3000/nope
```

---

<div align="center">

*This project was completed as part of the AI-Assisted Development course.*

</div>
