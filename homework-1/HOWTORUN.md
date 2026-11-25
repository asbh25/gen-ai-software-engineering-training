# ▶️ How to Run the Application

A step-by-step guide to run and test the **Banking Transactions API** (Node.js + Express, in-memory storage — no database needed).

---

## 1. Prerequisites

| Tool | Version | Check |
|------|---------|-------|
| **Node.js** | 18 or newer (developed and tested on v26.13.1) | `node -v` |
| **npm** | comes with Node.js (tested on 11.20.0) | `npm -v` |
| **curl** | any, for trying the API | `curl --version` |

Optional: the **REST Client** extension for VS Code, to run the `.http` demo files. No environment variables, `.env` file or database are required.

---

## 2. Install

Open a terminal in the project folder (the repository is already cloned) and install the dependencies:

```bash
cd homework-1
npm install
```

*(`./demo/run.sh` also runs `npm install` for you on the first start, so you can skip this step if you use it.)*

---

## 3. Run

Choose one way. The API listens on **http://localhost:3000**.

### Option A — `npm start`

```bash
npm start
```

### Option B — run script (recommended for the demo)

```bash
./demo/run.sh                  # empty store
./demo/run.sh --sample-data    # preload 16 example transactions from demo/sample-data.json
```

The script checks the Node version, installs dependencies if needed, and stops with a clear message if the port is already in use. If you get "Permission denied", run `chmod +x demo/run.sh` once.

### Configuration

| Setting | How | Default |
|---------|-----|---------|
| Port | `PORT=3100 npm start` or `PORT=3100 ./demo/run.sh` | `3000` |
| Preload sample data | `LOAD_SAMPLE_DATA=true npm start` or `./demo/run.sh --sample-data` | off |
| Other sample file | `SAMPLE_DATA_FILE=/path/to/file.json` (together with `LOAD_SAMPLE_DATA=true`) | `demo/sample-data.json` |

Expected output:

```
Banking API listening on http://localhost:3000
```
(with sample data you will also see `Loaded 16 sample transactions from demo/sample-data.json`).

### Stop

Press `Ctrl+C` in the terminal. **All data is stored in memory and is lost when the server stops.**

---

## 4. Check that it works

Open a second terminal:

```bash
curl http://localhost:3000/health
# {"status":"ok"}
```

Create a transaction and read the balance:

```bash
curl -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -d '{"toAccount":"ACC-12345","amount":500,"currency":"USD","type":"deposit"}'

curl http://localhost:3000/accounts/ACC-12345/balance
# {"accountId":"ACC-12345","balances":{"USD":500}}
```

### Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/transactions` | Create a transaction (an overdraft is stored as `failed`) |
| `GET` | `/transactions` | List; filters `?accountId=&type=&from=&to=` |
| `GET` | `/transactions/:id` | One transaction |
| `GET` | `/accounts/:accountId/balance` | Balance per currency |
| `GET` | `/accounts/:accountId/summary` | Totals, count, most recent date |
| `GET` | `/transactions/export?format=csv` | CSV export (same filters) |
| `GET` | `/health` | Health check |

Full descriptions, rules and more curl examples are in [README.md](README.md).

---

## 5. Testing guide

### 5.1 Automated tests

```bash
npm test
```

Runs 56 tests with Node's built-in test runner (no extra packages). They start the app on a random free port, so **you do not need to stop your server** on port 3000. Expected end of the output:

```
ℹ tests 56
ℹ pass 56
ℹ fail 0
```

Run a single file: `node --test tests/balance.test.js`. What each file covers is described in [README.md](README.md#-automated-tests).

### 5.2 Business rule: a balance never goes negative

An overdraft is **recorded as a failed transaction** (HTTP `201`, `"status": "failed"`, plus a `failureReason`) and changes nothing. Try it on a fresh server:

```bash
curl -X POST localhost:3000/transactions -H "Content-Type: application/json" \
  -d '{"toAccount":"ACC-12345","amount":100,"currency":"USD","type":"deposit"}'      # completed

curl -X POST localhost:3000/transactions -H "Content-Type: application/json" \
  -d '{"fromAccount":"ACC-12345","amount":100.01,"currency":"USD","type":"withdrawal"}'  # FAILED

curl -X POST localhost:3000/transactions -H "Content-Type: application/json" \
  -d '{"fromAccount":"ACC-12345","amount":100,"currency":"USD","type":"withdrawal"}'     # completed, balance = 0

curl localhost:3000/accounts/ACC-12345/balance      # {"accountId":"ACC-12345","balances":{"USD":0}}
```

### 5.3 Manual walkthrough with sample data

```bash
./demo/run.sh --sample-data          # terminal 1
```
In terminal 2, these results are expected with the sample data:

| Request | Expected result |
|---------|-----------------|
| `curl localhost:3000/transactions` | 16 transactions (11 completed, 4 failed, 1 pending) |
| `curl localhost:3000/accounts/ACC-12345/balance` | `{"USD": 924.75, "JPY": 15000}` |
| `curl localhost:3000/accounts/ACC-67890/balance` | `{"USD": 555.25}` |
| `curl localhost:3000/accounts/ACC-ABCDE/balance` | `{"EUR": 250, "USD": 0}` |
| `curl "localhost:3000/transactions?from=2024-01-01&to=2024-01-31"` | 9 transactions |
| `curl "localhost:3000/transactions?type=transfer"` | 5 transactions |
| `curl "localhost:3000/transactions?accountId=ACC-12345&type=transfer&from=2024-01-01&to=2024-01-31"` | 2 transactions |
| `curl localhost:3000/accounts/ACC-12345/summary` | deposits `{"USD": 1200, "JPY": 15000}`, withdrawals `{"USD": 100}`, count 10, latest `2024-02-14T12:00:00.000Z` |

The sample data deliberately contains **4 `failed` transactions** (overdrafts, each with a `failureReason`) and **1 `pending`** one. They are listed in the history, but are **not** counted in balances or in the summary totals. `ACC-ABCDE` ends with a USD balance of exactly `0` — spending the whole balance is allowed.

### 5.4 Demo request files (`demo/`)

| File | Covers | How to use |
|------|--------|------------|
| `sample-requests.http` | Tasks 1–3 and the overdraft rule: create/read, balance, every validation error, every filter | Open in VS Code with REST Client and click **Send Request** above each block |
| `sample-requests-task4.http` | Task 4: summary and CSV export | same |
| `sample-requests-task4.sh` | Task 4 as a script | `./demo/sample-requests-task4.sh` (needs a **fresh** server: it creates its own transactions) |
| `sample-data.json` | 16 example transactions (Jan–Feb 2024, USD/EUR/JPY, all three types, 4 failed, 1 pending) | loaded with `--sample-data` |

For a different port: `BASE_URL=http://localhost:3100 ./demo/sample-requests-task4.sh`. In the `.http` files change `@baseUrl` on the first lines.

### 5.5 What to look for

- Success: `201` on create, `200` on reads, an empty list is `[]`.
- **Check `status`, not only the HTTP code:** an overdraft is `201` with `"status": "failed"`.
- Validation errors: `400` with `{"error": "Validation failed", "details": [{"field": ..., "message": ...}]}` — every problem is listed at once and nothing is stored; `404` for an unknown transaction or route.
- Filters: combined filters narrow the result (AND); `to=2024-01-31` includes the whole day.

---

## 6. Troubleshooting

| Problem | Fix |
|---------|-----|
| `Error: listen EADDRINUSE ... :3000` / "Port 3000 is already in use" | An old server is still running. Stop it (`Ctrl+C` in its terminal, or `lsof -nP -iTCP:3000 -sTCP:LISTEN` then `kill <PID>`), or use `PORT=3100`. |
| New code or validation seems to have no effect | The old server is still running (see above). Restart the server after every code change. |
| Transactions disappeared | Expected: data lives in memory only. Recreate them or start with `--sample-data`. |
| `Permission denied: ./demo/run.sh` | `chmod +x demo/run.sh demo/sample-requests-task4.sh` |
| `npm: command not found` / old Node | Install Node.js 18+ from https://nodejs.org |
