# 🤖 AI Usage Log — Homework 1

**Tool:** Claude Code (model: Claude Opus 5.5)
**Stack:** Node.js + Express

> One entry per meaningful prompt. Keep it short: what I asked, what AI did, what I changed or checked myself.
> Screenshots live in `docs/screenshots/` (`ai-prompt-N.png` = prompt for entry #N, `api-running-1.png` = server + curl requests after Task 1, `api-running-2.png` = all validation errors in one response, `api-running-3.png` = invalid filter error).

---

## Entry template (copy this)

```
### #N — <short title>
- **Date:** YYYY-MM-DD
- **Prompt:** "<what I asked>"
- **AI result:** <what it generated / suggested>
- **My changes / verification:** <what I fixed, rejected, or tested>
- **Screenshot:** ![description](screenshots/<file>.png) (optional)
```

---

## Log

### #1 — Analyze repository and plan the homework
- **Date:** 2026-11-25
- **Prompt:** "Analyze readme and another file in the root folder. Make a plan for homework 1 that I can follow alone, and describe what you read."
- **AI result:** Summarized the root `README.md` (submission rules, grading), `recommended-agents-skills-pipelines.md` (list of Claude Code plugins/skills), and `TASKS.md`; produced a 10-step plan with a checklist.
- **My changes / verification:** Reviewed the plan against `TASKS.md`; confirmed fork and created `homework-1-submission` branch myself.
- **Screenshot:** ![AI prompt 1](screenshots/ai-prompt-1.png)

### #2 — Save the plan to a file
- **Date:** 2026-11-25
- **Prompt:** "Save this plan to a file."
- **AI result:** Created `homework-1/PLAN.md`.
- **My changes / verification:** —
- **Screenshot:** ![AI prompt 2](screenshots/ai-prompt-2.png)

### #3 — Is an AI log required?
- **Date:** 2026-11-25
- **Prompt:** "Is 'start an AI log now' needed?"
- **AI result:** Explained it isn't required by the assignment, but screenshots and an AI-usage section in README/PR are; suggested lightweight options (`/export`).
- **My changes / verification:** Decided to keep a log in this file.
- **Screenshot:** ![AI prompt 3](screenshots/ai-prompt-3.png)

### #4 — Set up the AI log
- **Date:** 2026-11-25
- **Prompt:** "How to start AI log from now? Stack will be Node.js + Express. Can we log in an MD file?"
- **AI result:** Created this file with a template and back-filled entries #1–#4.
- **My changes / verification:** —
- **Screenshot:** ![AI prompt 4](screenshots/ai-prompt-4.png)

### #5 — Step 1: scaffold Express project
- **Date:** 2026-11-25
- **Prompt:** "Start with step 1, create the project inside homework-1/, use the folder layout from TASKS.md, start the server on port 3000."
- **AI result:** Created `package.json`, `.gitignore`, installed Express, created `src/{routes,models,validators,utils}`, `src/app.js` (JSON parsing, `/health`, 400 for invalid JSON, 404 for unknown routes) and `src/index.js` (listens on port 3000).
- **My changes / verification:** Server starts on `http://localhost:3000`; `/health` → 200, unknown route → 404, malformed JSON → 400 (checked with curl).
- **Screenshot:** ![AI prompt 5](screenshots/ai-prompt-5.png)

### #6 — Task 1: core API implementation
- **Date:** 2026-11-25
- **Prompt:** "Do the task 1: core api implementation, we need four endpoints - POST /transactions, GET /transactions, GET /transactions/:id, GET /accounts/:accountId/balance; model and requirements are in TASKS.md."
- **AI result:** Added `models/transaction.js` (in-memory array, UUID id, ISO timestamp, status `completed`), `validators/transactionValidator.js` (basic checks), `routes/transactions.js`, `routes/accounts.js`, `utils/helpers.js` (balance calculation), wired routers in `app.js`, added a 500 handler.
- **Design decisions:** balance counts only `completed` transactions; deposit → +toAccount, withdrawal → −fromAccount, transfer moves money; balance is returned **per currency** (`balances: {USD: 399.4}`) because mixed currencies can't be added together; unknown account → 200 with empty balances; no overdraft check.
- **My changes / verification:** Tested all endpoints with curl: 201 on create, 200 on lists/balance, 400 on validation errors and bad JSON, 404 on unknown id/route. Balance check: 500 − 100.50 − 0.10 = 399.40 ✔.
- **Screenshot:** ![AI prompt 6](screenshots/ai-prompt-6.png)
- **API running (after Task 1):** ![API running](screenshots/api-running-1.png)

### #7 — Task 2: transaction validation
- **Date:** 2026-11-25
- **Prompt:** "Do the task 2: Transaction Validation, add some new samples to README.md"
- **AI result:** Rewrote `validators/transactionValidator.js` (max 2 decimals, `ACC-XXXXX` regex, ISO 4217 whitelist in new `utils/currencies.js`, all errors collected); added a validation-rules table and ~8 new curl examples to the README.
- **Design decisions:** strict formats (uppercase currency, `ACC-` prefix); any *provided* account is format-checked even when optional for the type; GET endpoints don't validate IDs. The 2-decimal check uses a cents tolerance so `0.29` passes and `1.005` fails.
- **My changes / verification:** Tested 15+ cases with curl (`100.5` ✅, `0.29` ✅, `100.555` ❌, `1.005` ❌, `ACC-1234` ❌, `ACC-AB12Z` ✅, `usd` ❌, `XXX` ❌, all-wrong body returns 4 errors). First HTTP run still showed old behaviour because an older server was still running on port 3000 — caught by comparing against a direct call of the validator, then re-tested on a clean port.
- **Screenshot:** ![AI prompt 7 (1/2)](screenshots/ai-prompt-7-1.png)
  ![AI prompt 7 (2/2)](screenshots/ai-prompt-7-2.png)
- **Validation errors (all in one):** ![All validation errors](screenshots/api-running-2.png)

### #8 — Task 3: basic transaction history (filters)
- **Date:** 2026-11-25
- **Prompt:** "Do the Task 3: Basic Transaction History"
- **AI result:** Added `validators/filterValidator.js` (validates `accountId`, `type`, `from`, `to`), `filterTransactions()` in `utils/helpers.js`, and wired both into `GET /transactions`; documented the filters and curl examples in the README.
- **Design decisions:** `accountId` matches sender **or** receiver; filters combine with AND; dates accept `YYYY-MM-DD` or ISO datetime in UTC; a date-only `to` includes the whole day (`23:59:59.999`); invalid filters return 400 in the same error format instead of being ignored; no matches → `200 []`.
- **My changes / verification:** Checked the date logic with fabricated timestamps (boundaries `2024-01-31T23:59:59.999Z` included, `2024-02-01T00:00:00Z` excluded, `from == to` single day, `2024-02-30` rejected). Then tested over HTTP: account/type/date/combined filters, 400 cases, and an empty result. Used a separate port (`PORT=3100`) for tests so they don't touch the server running on 3000.
- **Screenshot:** ![AI prompt 8 (1/2)](screenshots/ai-prompt-8-1.png)
  ![AI prompt 8 (2/2)](screenshots/ai-prompt-8-2.png)
- **Invalid filter (400):** ![Invalid filter error](screenshots/api-running-3.png)
