# 🏦 Homework 1: Banking Transactions API

> **Student Name**: Andrii Suboch
> **Date Submitted**: 25.11.2026
> **AI Tools Used**: Claude Code (Claude Opus 5.5 / Sonnet 5.5)

---

## 📋 Project Overview

A minimal REST API for banking transactions built with **Node.js + Express**, using in-memory storage (no database). Data is lost when the server restarts.

> ✅ **All tasks implemented, plus a business rule and an automated test suite:** Task 1 (core API), Task 2 (transaction validation), Task 3 (transaction history filters) and Task 4 (two additional features: **Option A** summary endpoint and **Option C** CSV export). On top of the assignment: **a balance can never go negative** — an overdraft is recorded as a `failed` transaction (see [Insufficient funds](#-business-rule-balance-never-goes-negative)) — and **56 automated tests** (`npm test`).

## 🚀 Quick Start

```bash
cd homework-1
./demo/run.sh --sample-data      # installs dependencies, preloads 16 example transactions, starts on :3000
curl http://localhost:3000/transactions
```

Requires Node.js 18+. Run the tests with `npm test`. Full instructions, configuration, a testing guide and troubleshooting are in **[HOWTORUN.md](HOWTORUN.md)**. Ready-made requests are in [`demo/`](demo/).

### Endpoints

| Method   | Endpoint                            | Description                                                                                                    | Status codes |
| -------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------ |
| `POST` | `/transactions`                   | Create a new transaction (an overdraft is stored as `failed`, still `201`)                                     | 201, 400     |
| `GET`  | `/transactions`                   | List transactions, optionally filtered (`accountId`, `type`, `from`, `to`)                             | 200, 400     |
| `GET`  | `/transactions/:id`               | Get one transaction by ID                                                                                      | 200, 404     |
| `GET`  | `/accounts/:accountId/balance`    | Get account balance                                                                                            | 200          |
| `GET`  | `/accounts/:accountId/summary`    | Account summary: total deposits, total withdrawals, transaction count, most recent date *(Task 4, Option A)* | 200          |
| `GET`  | `/transactions/export?format=csv` | Export transactions as CSV, supports the same filters as the list *(Task 4, Option C)*                       | 200, 400     |
| `GET`  | `/health`                         | Health check                                                                                                   | 200          |

An overdraft is **not** an HTTP error: the attempt is recorded with `status: "failed"` and a `failureReason`, and the response is still `201`. Unknown routes return `404`; malformed JSON bodies return `400`; unexpected errors return `500`.

### Project structure

```
src/
├── index.js                          # starts the server (port 3000)
├── app.js                            # Express app, routers, error handlers
├── routes/
│   ├── transactions.js               # /transactions endpoints (+ CSV export)
│   └── accounts.js                   # /accounts/:accountId/balance and /summary
├── models/transaction.js             # in-memory storage + create/find/seed
├── validators/
│   ├── transactionValidator.js       # POST body validation
│   └── filterValidator.js            # GET /transactions query validation
└── utils/
    ├── helpers.js                    # balance, funds check, summary and transaction filtering
    ├── csv.js                        # CSV formatting/escaping for the export
    ├── seed.js                       # optional loader for demo/sample-data.json
    └── currencies.js                 # ISO 4217 currency code list
demo/
├── run.sh                            # install + start the API (--sample-data to preload data)
├── sample-data.json                  # 16 example transactions (Jan-Feb 2024), incl. failed and pending
├── sample-requests.http              # requests for Tasks 1-3 (VS Code REST Client)
├── sample-requests-task4.http        # requests for Task 4 (VS Code REST Client)
└── sample-requests-task4.sh          # Task 4 requests as a runnable curl script
tests/                                # automated tests (node:test, no extra dependencies)
├── helpers.js                        # starts the app on a random port, request helpers
├── transactions.test.js              # core API + validation
├── balance.test.js                   # balances + the "never negative" rule
├── history.test.js                   # filters, summary, CSV export
└── sample-data.test.js               # sample data is valid and consistent with the rules
docs/
├── ai-log.md                         # log of every AI prompt, result and my verification
└── screenshots/                      # screenshots of AI interactions and the running API
PLAN.md                               # the plan I made with the agent before coding
HOWTORUN.md                           # how to run and test
```

---

## 🤖 AI-Assisted Workflow

**Tool:** Claude Code (Claude Opus 5.5, later Sonnet 5.5). Every prompt, what the agent produced and what I verified is recorded in **[docs/ai-log.md](docs/ai-log.md)**, with screenshots.

**How I worked:**

1. **Context first.** Before writing any code I gave the agent context: I asked it to read the course `README.md` (submission rules and grading), the other markdown file in the repo root, and `homework-1/TASKS.md`, and to explain what it had read.
2. **Then a plan.** I asked the agent to turn that into a step-by-step plan for homework 1 and **saved it in the repository as [`PLAN.md`](PLAN.md)** (entries #1–#2 in the AI log). The plan lists the steps, the decisions to make and a final checklist.
3. **Then one task at a time.** After that, AI-assisted development was much easier for me, because **the agent understood its mission**: it knew the assignment, the required folder layout, the error format and the deliverables. My later prompts could be short ("do Task 2", "do Task 3") and the results still matched the requirements.
4. **Verify and record.** After each step the agent tested the endpoints with curl (on a separate port so my running server was not disturbed). I checked the results, took screenshots of the prompts and of the API running, and added the entry to the log.

**What the AI did, what I did:**

| Area | AI | Me |
|------|----|----|
| Understanding the task | Read and summarized the repo, drafted the plan | Gave the context, reviewed and saved the plan, forked the repo and created the branch |
| Code | Express app, validators, filters, summary, CSV export, seed loader, funds check | Chose the stack (Node.js + Express), picked the Task 4 options, **defined the "balance never negative" rule**, reviewed the code and design decisions |
| Documentation | README, HOWTORUN, demo requests and sample data | Reviewed them and filled in the author details |
| Tests | Wrote the automated test suite and ran it | Asked for it; reviewed the results |
| Evidence | Wrote the log entries | Took all screenshots and checked the log references |

5. **Changing the rules later.** After the four tasks I decided on a business rule myself: a balance may never go negative, so overdrafts produce `failed` transactions. Because the agent already knew the project, one prompt was enough to change the code, the sample data, the documentation and to add tests for it (entry #11 in the log).

**What went wrong along the way** (also in the log): during Task 2 the first HTTP test still showed the old behaviour because an older server was still listening on port 3000; this was found by comparing with a direct call of the validator, and from then on the manual tests ran on a separate port. This is why [HOWTORUN.md](HOWTORUN.md) has a troubleshooting entry about it. Also, writing the automated tests exposed a real bug in my own earlier validator: the 2-decimal check wrongly rejected large amounts such as `1234567.89`; it was fixed and now a brute-force check of every value from 0.01 to 5000.00 passes (entry #11).

---

## 🧠 Design Decisions

| Topic                             | Decision                                                                                                                                                                                                        | Why                                                                                           |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **Storage**                 | In-memory array                                                                                                                                                                                                 | Required by the task; simplest option.                                                        |
| **Transaction ID**          | UUID (`crypto.randomUUID`)                                                                                                                                                                                    | Unique without a counter or database.                                                         |
| **Timestamp**               | Set by the server in ISO 8601                                                                                                                                                                                   | Clients can't forge it.                                                                       |
| **Status**                  | A valid transaction is saved as `completed`, or as `failed` when the sender has insufficient funds. `pending` is never produced by the API (it only appears in the demo sample data) | Processing is immediate, so there is nothing to wait for.                                 |
| **Required accounts**       | `deposit` needs `toAccount`; `withdrawal` needs `fromAccount`; `transfer` needs both and they must differ                                                                                             | Each type involves different accounts. Missing accounts are stored as `null`.               |
| **Balance rules**           | Only `completed` transactions count. Deposit → `+amount` to `toAccount`; withdrawal → `−amount` from `fromAccount`; transfer → `−amount` from `fromAccount` and `+amount` to `toAccount` | Standard bookkeeping.                                                                         |
| **Balance per currency**    | Response is `{ "accountId": "...", "balances": { "USD": 399.4, "EUR": 20 } }`                                                                                                                                 | USD and EUR can't be added together, so each currency is tracked separately.                  |
| **Unknown account balance** | `200` with `"balances": {}`                                                                                                                                                                                 | Accounts aren't created explicitly, so an account with no transactions simply has no balance. |
| **Overdraft**               | **Not allowed.** A withdrawal or transfer that would make the sender's balance negative is stored as `failed` and changes nothing | A bank balance must not go below zero — see the business rule below.                          |
| **Rounding**                | Balances are rounded to 2 decimals                                                                                                                                                                              | Avoids floating-point drift such as `0.1 + 0.2`.                                            |
| **Validation errors**       | All errors collected and returned as `{ "error": "Validation failed", "details": [{ "field", "message" }] }`                                                                                                  | Matches the format in `TASKS.md`.                                                           |

### Validation rules (Task 2)

All rules run on `POST /transactions`. **Every** problem is collected and returned together, so the client can fix them in one go (`400` + `details` list).

| Field                           | Rule                                                                                                                                                                               | Error message                                                    |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `amount`                      | Must be a number greater than 0 (strings like `"10"` are rejected)                                                                                                               | `Amount must be a positive number`                             |
| `amount`                      | At most 2 decimal places (`100.5` ✅, `100.555` ❌)                                                                                                                            | `Amount must have at most 2 decimal places`                    |
| `currency`                    | Required; must be an **uppercase** ISO 4217 code (~160 active codes: USD, EUR, GBP, JPY, UAH, …)                                                                            | `Currency is required` / `Invalid currency code (...)`       |
| `type`                        | One of `deposit`, `withdrawal`, `transfer`                                                                                                                                   | `Type must be one of: deposit, withdrawal, transfer`           |
| `fromAccount` / `toAccount` | Format `ACC-XXXXX` — `ACC-` plus exactly 5 letters or digits (regex `^ACC-[A-Za-z0-9]{5}$`). Applies to **any** account that is sent, even when optional for the type | `Account must follow the format ACC-XXXXX (X is alphanumeric)` |
| `fromAccount` / `toAccount` | Required depending on type (deposit → `toAccount`; withdrawal → `fromAccount`; transfer → both)                                                                             | `<field> is required for <type>`                               |
| `toAccount`                   | For a transfer it must differ from `fromAccount`                                                                                                                                 | `toAccount must differ from fromAccount`                       |

Extra decisions:

- Lowercase currency codes (`usd`) and lowercase prefixes (`acc-12345`) are rejected — strict formats are easier to reason about.
- The 2-decimal check is exact: `0.29` and `1234567.89` pass, while `1.005` and `100.555` are rejected.
- Amounts are checked with `Number(n.toFixed(2)) === n`, which works for any size (an earlier multiply-by-100 version wrongly rejected `1234567.89`; found by the automated tests).
- `GET` endpoints don't validate account IDs; an unknown or malformed ID just returns an empty balance.

### 💰 Business rule: balance never goes negative

A withdrawal or a transfer is only **completed** if the sending account has enough money **in that currency**. Otherwise the attempt is still recorded, as a **`failed`** transaction, and no balance changes.

| Case | Result |
|------|--------|
| Withdrawal / transfer ≤ available balance | `completed` |
| Withdrawal / transfer > available balance | `failed` + `failureReason` |
| Amount **exactly** equal to the balance | `completed` — the balance becomes `0` (never below) |
| Deposit | always `completed` |
| Account has USD but a EUR withdrawal is requested | `failed` — funds are checked **per currency** |

Details and decisions:
- **Only `completed` transactions count as available money.** `failed` and `pending` ones are ignored, so a `pending` deposit cannot be spent yet.
- **HTTP status is `201`, not an error code.** The request itself is valid and a transaction record *was* created — its `status` is `failed`. This keeps to the status codes of the assignment (200/201/400/404) and gives clients the full record. Clients must check `status`, not just the HTTP code.
- **`failureReason`** is added only to failed transactions, e.g. `"Insufficient funds: available 749.5 USD, requested 800 USD"`. It is also in the CSV export (last column).
- **Failed transactions are visible everywhere:** `GET /transactions`, `GET /transactions/:id`, the CSV export, and in the summary's `transactionCount` / `mostRecentTransactionDate`. They never change a balance or the deposit/withdrawal totals.
- **Validation errors are different:** malformed requests (bad amount, account, currency…) still return `400` and are **not** stored.

### Transaction history filters (Task 3)

`GET /transactions` accepts four optional query parameters. When several are given they are **all applied together (AND)**; with none, every transaction is returned.

| Parameter     | Matches                                                                                                  | Example                  |
| ------------- | -------------------------------------------------------------------------------------------------------- | ------------------------ |
| `accountId` | Transactions where the account is the sender (`fromAccount`) **or** the receiver (`toAccount`) | `?accountId=ACC-12345` |
| `type`      | Exact type: `deposit`, `withdrawal` or `transfer`                                                  | `?type=transfer`       |
| `from`      | Transactions at or after this moment                                                                     | `?from=2024-01-01`     |
| `to`        | Transactions at or before this moment                                                                    | `?to=2024-01-31`       |

Decisions:

- **Dates:** `from`/`to` accept `YYYY-MM-DD` or a full ISO 8601 datetime with timezone (`2024-01-31T10:00:00Z`). All dates are interpreted in **UTC**.
- **Inclusive range:** a date-only `from` means the start of that day (`00:00:00.000`) and a date-only `to` means the **end** of that day (`23:59:59.999`), so `from=2024-01-31&to=2024-01-31` returns the whole day.
- **Strict input:** invalid values return `400` with the same `{"error": "Validation failed", "details": [...]}` format instead of being silently ignored. That covers a bad account format, an unknown type, a non-date (`from=yesterday`), an impossible date (`2024-02-30`), `from` later than `to`, and a repeated parameter (`?type=a&type=b`). All problems are reported together.
- **No match** is not an error: it returns `200` with `[]`.

### Additional features (Task 4)

Two options were implemented: **A (summary)** and **C (CSV export)**.

**Option A — `GET /accounts/:accountId/summary`**

| Field                         | Meaning                                                                                                       |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `totalDeposits`             | Sum of completed `deposit` transactions received by the account, **per currency**                     |
| `totalWithdrawals`          | Sum of completed `withdrawal` transactions made from the account, **per currency**                    |
| `transactionCount`          | Number of transactions involving the account as sender or receiver — **all types**, transfers included |
| `mostRecentTransactionDate` | Timestamp of the latest transaction, or `null` if there are none                                            |

- Transfers are **not** added to deposits/withdrawals (they move money between accounts rather than entering or leaving the bank), but they do count in `transactionCount` and `mostRecentTransactionDate`.
- **Failed and pending transactions** are counted in `transactionCount` and `mostRecentTransactionDate` (they are real attempts), but never in the deposit/withdrawal totals.
- Totals are per currency for the same reason as balances: USD and EUR can't be added together.
- An account without transactions returns `200` with empty totals, `transactionCount: 0` and `null` date (same idea as the balance endpoint).

**Option C — `GET /transactions/export?format=csv`**

- Returns `text/csv` with a header row (`id,fromAccount,toAccount,amount,currency,type,timestamp,status,failureReason`) and `Content-Disposition: attachment; filename="transactions.csv"`, so browsers download it as a file.
- `format` is optional and defaults to `csv`; any other value returns `400`.
- It accepts the **same filters** as the list endpoint (`accountId`, `type`, `from`, `to`), so you can export just one account or one month. No matches → only the header row.
- Missing accounts (e.g. `fromAccount` of a deposit) and the `failureReason` of completed transactions are exported as empty cells. Values are escaped per RFC 4180 (quotes, commas, line breaks).
- The route is registered **before** `/transactions/:id`; otherwise Express would treat `export` as a transaction id and return 404.

Ready-made requests for both features are in [`demo/sample-requests-task4.http`](demo/sample-requests-task4.http) and [`demo/sample-requests-task4.sh`](demo/sample-requests-task4.sh).

---

## 🧪 Example Requests

Start the server first (`npm start`), then run these in a second terminal. The server runs at `http://localhost:3000`. Run the three create examples **in order** on a fresh server: the withdrawal and the transfer need money on the account, which the deposit provides.

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

**Overdraft** — more than the available balance (`ACC-12345` has 349.5 USD after the three requests above) → still `201`, but the transaction is **`failed`** and no balance changes:

```bash
curl -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "fromAccount": "ACC-12345",
    "amount": 99999,
    "currency": "USD",
    "type": "withdrawal"
  }'
```

```json
{
  "id": "5a0c2d9e-7f41-4b2e-9c1a-0d3e6f8b1a77",
  "fromAccount": "ACC-12345",
  "toAccount": null,
  "amount": 99999,
  "currency": "USD",
  "type": "withdrawal",
  "timestamp": "2026-11-25T13:01:24.580Z",
  "status": "failed",
  "failureReason": "Insufficient funds: available 349.5 USD, requested 99999 USD"
}
```

Spending exactly the whole balance is allowed (the balance becomes `0`); one cent more fails. Funds are checked per currency, so a EUR withdrawal from an account that only has USD also fails.

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

### 5. Filter the history — `GET /transactions?...` (Task 3)

Assuming these transactions exist (created with the examples above): a 500 USD deposit to `ACC-12345`, a 100.50 USD transfer `ACC-12345 → ACC-67890`, and a 50 USD withdrawal from `ACC-12345`.

**By account** (sender or receiver) — returns all three above for `ACC-12345`, only the transfer for `ACC-67890`:

```bash
curl "http://localhost:3000/transactions?accountId=ACC-12345"
curl "http://localhost:3000/transactions?accountId=ACC-67890"
```

**By type:**

```bash
curl "http://localhost:3000/transactions?type=transfer"
```

**By date range** (inclusive, whole days in UTC):

```bash
curl "http://localhost:3000/transactions?from=2024-01-01&to=2024-01-31"

# only one boundary
curl "http://localhost:3000/transactions?from=2024-01-01"
curl "http://localhost:3000/transactions?to=2024-01-31"

# a single day
curl "http://localhost:3000/transactions?from=2024-01-15&to=2024-01-15"

# exact time with an ISO 8601 datetime
curl "http://localhost:3000/transactions?from=2024-01-15T09:00:00Z&to=2024-01-15T17:30:00Z"
```

**Combine filters** — transfers of `ACC-12345` during January 2024:

```bash
curl "http://localhost:3000/transactions?accountId=ACC-12345&type=transfer&from=2024-01-01&to=2024-01-31"
```

**Today's transactions** (handy for a quick demo, because timestamps are set by the server):

```bash
curl "http://localhost:3000/transactions?from=$(date -u +%F)&to=$(date -u +%F)"
```

**No matches** → `200 []`:

```bash
curl "http://localhost:3000/transactions?accountId=ACC-99999"
```

### 6. Account summary — `GET /accounts/:accountId/summary` (Task 4, Option A)

```bash
curl http://localhost:3000/accounts/ACC-12345/summary
```

Response — `200 OK` (after the deposit, transfer and withdrawal above plus a 250.25 USD and a 20 EUR deposit):

```json
{
  "accountId": "ACC-12345",
  "totalDeposits": { "USD": 750.25, "EUR": 20 },
  "totalWithdrawals": { "USD": 50 },
  "transactionCount": 5,
  "mostRecentTransactionDate": "2026-11-25T13:01:03.698Z"
}
```

Account with no transactions:

```bash
curl http://localhost:3000/accounts/ACC-00000/summary
```

```json
{
  "accountId": "ACC-00000",
  "totalDeposits": {},
  "totalWithdrawals": {},
  "transactionCount": 0,
  "mostRecentTransactionDate": null
}
```

### 7. Export as CSV — `GET /transactions/export?format=csv` (Task 4, Option C)

```bash
# print to the terminal (-i also shows the headers)
curl -i "http://localhost:3000/transactions/export?format=csv"

# save to a file
curl -o transactions.csv "http://localhost:3000/transactions/export?format=csv"

# export with filters (same as GET /transactions)
curl "http://localhost:3000/transactions/export?format=csv&type=transfer"
curl "http://localhost:3000/transactions/export?format=csv&accountId=ACC-12345&from=2024-01-01&to=2024-01-31"
```

Response — `200 OK`, `Content-Type: text/csv; charset=utf-8`:

```csv
id,fromAccount,toAccount,amount,currency,type,timestamp,status,failureReason
13563973-7a73-4486-8e11-3a7aba7122ee,,ACC-12345,500,USD,deposit,2026-11-25T13:01:24.504Z,completed,
e273d83c-363e-4159-bbf3-58e1995fc148,ACC-12345,ACC-67890,100.5,USD,transfer,2026-11-25T13:01:24.550Z,completed,
1d456bcd-081b-4d5d-a1b4-5591cba4e88b,ACC-12345,,50,USD,withdrawal,2026-11-25T13:01:24.562Z,completed,
5a0c2d9e-7f41-4b2e-9c1a-0d3e6f8b1a77,ACC-12345,,99999,USD,withdrawal,2026-11-25T13:01:24.580Z,failed,"Insufficient funds: available 349.5 USD, requested 99999 USD"
```

Unsupported format → `400`:

```bash
curl -i "http://localhost:3000/transactions/export?format=xml"
```

```json
{
  "error": "Validation failed",
  "details": [
    { "field": "format", "message": "Unsupported format. Only \"csv\" is supported" }
  ]
}
```

### 8. Validation error examples (Task 2)

All of these return `400` with `{"error": "Validation failed", "details": [...]}`.

**Too many decimal places:**

```bash
curl -i -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -d '{"toAccount": "ACC-12345", "amount": 100.555, "currency": "USD", "type": "deposit"}'
```

```json
{
  "error": "Validation failed",
  "details": [
    { "field": "amount", "message": "Amount must have at most 2 decimal places" }
  ]
}
```

**Zero, negative or non-numeric amount:**

```bash
curl -i -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -d '{"toAccount": "ACC-12345", "amount": -5, "currency": "USD", "type": "deposit"}'

curl -i -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -d '{"toAccount": "ACC-12345", "amount": "abc", "currency": "USD", "type": "deposit"}'
```

→ `{"field": "amount", "message": "Amount must be a positive number"}`

**Invalid account format** (too short, too long, wrong prefix or special characters):

```bash
curl -i -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -d '{"toAccount": "ACC-123", "amount": 10, "currency": "USD", "type": "deposit"}'
```

```json
{
  "error": "Validation failed",
  "details": [
    { "field": "toAccount", "message": "Account must follow the format ACC-XXXXX (X is alphanumeric)" }
  ]
}
```

Other rejected examples: `ACC-123456`, `ACC-12#45`, `acc-12345`, `12345`. Accepted: `ACC-12345`, `ACC-AB12Z`.

**Invalid currency code:**

```bash
curl -i -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -d '{"toAccount": "ACC-12345", "amount": 10, "currency": "XXX", "type": "deposit"}'
```

→ `{"field": "currency", "message": "Invalid currency code (use an uppercase ISO 4217 code, e.g. USD, EUR, GBP)"}`

Also rejected: `"usd"` (lowercase), `"DOLLAR"`, `123`. Accepted: `"JPY"`, `"UAH"`, `"PLN"`.

**Transfer to the same account:**

```bash
curl -i -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -d '{"fromAccount": "ACC-12345", "toAccount": "ACC-12345", "amount": 10, "currency": "USD", "type": "transfer"}'
```

→ `{"field": "toAccount", "message": "toAccount must differ from fromAccount"}`

**Transfer missing `fromAccount`:**

```bash
curl -i -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -d '{"toAccount": "ACC-12345", "amount": 5, "currency": "USD", "type": "transfer"}'
```

→ `{"field": "fromAccount", "message": "fromAccount is required for transfer"}`

**Everything wrong at once** — all errors are reported together:

```bash
curl -i -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -d '{"fromAccount": "x", "toAccount": "y", "amount": -1.234, "currency": "ZZZ", "type": "transfer"}'
```

```json
{
  "error": "Validation failed",
  "details": [
    { "field": "amount", "message": "Amount must be a positive number" },
    { "field": "currency", "message": "Invalid currency code (use an uppercase ISO 4217 code, e.g. USD, EUR, GBP)" },
    { "field": "fromAccount", "message": "Account must follow the format ACC-XXXXX (X is alphanumeric)" },
    { "field": "toAccount", "message": "Account must follow the format ACC-XXXXX (X is alphanumeric)" }
  ]
}
```

📸 Real output from the running API:

![All validation errors reported in one response](docs/screenshots/api-running-2.png)

### 9. Invalid filters (Task 3)

All return `400`. Invalid type:

```bash
curl -i "http://localhost:3000/transactions?type=gift"
```

```json
{
  "error": "Validation failed",
  "details": [
    { "field": "type", "message": "type must be one of: deposit, withdrawal, transfer" }
  ]
}
```

Other rejected requests:

```bash
curl -i "http://localhost:3000/transactions?accountId=12345"            # not ACC-XXXXX
curl -i "http://localhost:3000/transactions?from=yesterday"             # not a date
curl -i "http://localhost:3000/transactions?to=2024-02-30"              # impossible date
curl -i "http://localhost:3000/transactions?from=2024-02-01&to=2024-01-01"  # from after to
curl -i "http://localhost:3000/transactions?type=deposit&type=transfer" # repeated parameter
```

→ e.g. `{"field": "from", "message": "from must not be later than to"}`

**Several invalid filters at once** — all errors are reported together:

```bash
curl -i "http://localhost:3000/transactions?accountId=bad&type=gift&from=x"
```

### 10. Other errors

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

## 🧪 Automated Tests

```bash
npm test
```

56 tests with Node's built-in test runner (`node:test`) — **no extra dependencies**. The tests start the real Express app on a random free port, so they never clash with a server running on port 3000. Expected output ends with `ℹ pass 56` and `ℹ fail 0`.

| File | Covers |
|------|--------|
| `tests/transactions.test.js` | Task 1 endpoints and status codes; every Task 2 validation rule, including boundaries (`100.5` / `100.555`, `ACC-1234` / `ACC-AB12Z`, ISO currencies), "all errors at once", client-supplied id/timestamp/status ignored |
| `tests/balance.test.js` | Balance rules, per-currency balances, rounding, and the **never-negative rule**: failed withdrawal and transfer, exact-balance edge case, per-currency check, pending/failed money cannot be spent |
| `tests/history.test.js` | Task 3 filters (OR on account, AND combination, inclusive day boundaries, ISO datetimes, every 400 case), Task 4 summary, CSV export (headers, filters, escaping, `export` vs `:id` route order) |
| `tests/sample-data.test.js` | `demo/sample-data.json` is valid, **replayed in time order it obeys the rule** (no completed overdraft; every failed entry really would have overdrawn), and the numbers quoted in HOWTORUN.md are true |

As a sanity check, temporarily disabling the funds check makes 10 of the 56 tests fail.

## ⚠️ Known Limitations

- **In-memory storage:** all data is lost when the server restarts.
- **No authentication:** anyone can create transactions for any account; accounts are not created or owned by anyone.
- **No `pending` state:** every transaction is processed immediately (`completed` or `failed`); `pending` only appears in the demo sample data.
- **Failed attempts cannot be retried or deleted:** a failed transaction stays in the history as a record.
- **UTC only:** date filters are interpreted in UTC.

## 📸 Screenshots

Key screenshots are in [`docs/screenshots/`](docs/screenshots/); the full set with prompts is embedded in [docs/ai-log.md](docs/ai-log.md).

| API running, create / read / balance | All validation errors at once | Task 4 demo script |
|---|---|---|
| ![API running](docs/screenshots/api-running-1.png) | ![Validation errors](docs/screenshots/api-running-2.png) | ![Task 4 demo](docs/screenshots/sample-requests-task4.png) |

---

<div align="center">
