# 📝 Plan for Homework 1 — Banking Transactions API

> Personal working plan. Grading reminder: Functionality 30%, AI usage docs 25%, Code quality 20%, Documentation 15%, Demo & screenshots 10% — **half the grade is documentation, AI evidence and screenshots.**

---

## Step 0: Set up (about 15 minutes)
1. Check that your local repo is **your fork**: run `git remote -v`. If it points to `Alexey-Popov/...`, fork it on GitHub and re-clone.
2. Create the branch: `git checkout -b homework-1-submission`
3. Pick a stack. The easiest options are **Node.js + Express** or **Python + FastAPI**. FastAPI gives you validation and Swagger docs at `/docs` for free.
4. **Start an AI log now** (for example `docs/ai-log.md`). Write down each prompt, what the AI produced, and what you changed. Take screenshots as you go, because it's hard to recreate them later.

## Step 1: Scaffold the project (Task 1 setup)
- Create the project inside `homework-1/` (`package.json` or `requirements.txt`, plus `.gitignore` for `node_modules/`, `.venv/`, `.env`).
- Use the folder layout from TASKS.md: `src/routes`, `src/models`, `src/validators`, `src/utils`.
- Start the server on **port 3000**, because the sample curl commands use `localhost:3000`.
- 📸 **Screenshot:** the AI prompt that generated the scaffold.

## Step 2: Core endpoints (Task 1)

| Endpoint | Expected result |
|---|---|
| `POST /transactions` | Create a transaction. The server sets `id` (UUID), `timestamp` (ISO 8601) and `status`. Returns **201**. |
| `GET /transactions` | Returns an array. **200** |
| `GET /transactions/:id` | **200**, or **404** if not found |
| `GET /accounts/:accountId/balance` | **200** with `{accountId, balance, currency}` |

Decisions to make and write down in your README:
- **Balance logic:** a deposit adds to `toAccount`, a withdrawal subtracts from `fromAccount`, and a transfer moves money from one account to the other. Count only `completed` transactions.
- **Which account fields each type needs:** a deposit may have no `fromAccount`, and a withdrawal may have no `toAccount`.
- **Mixed currencies:** either compute the balance per currency or reject it. Pick one.
- **Initial status:** the simplest choice is to mark every transaction `completed` right away.

Check that unknown routes return 404 and invalid JSON returns 400.

## Step 3: Validation (Task 2)
- `amount`: must be a positive number with at most 2 decimal places. `100.5` passes, `100.555` fails, and `-5`, `0` and `"abc"` fail.
- Accounts: must match the regex `^ACC-[A-Za-z0-9]{5}$`.
- `currency`: check against a whitelist of ISO 4217 codes (USD, EUR, GBP, JPY, CHF, CAD, AUD, PLN, UAH, …).
- `type`: must be one of `deposit`, `withdrawal`, `transfer`.
- **Collect all errors**, not just the first one, and return them in the exact format from TASKS.md:
  `{"error": "Validation failed", "details": [{"field": ..., "message": ...}]}` with status **400**.
- 📸 **Screenshot:** a validation error response.

## Step 4: Filtering (Task 3)
`GET /transactions?accountId=&type=&from=&to=`
- `accountId` matches either `fromAccount` **or** `toAccount`.
- For `from`/`to`, include the whole `to` day: `2024-01-31` should mean up to the end of that day.
- When several filters are given, apply all of them (AND logic).
- Return 400 for an invalid `type` or date.

## Step 5: Extra feature (Task 4, at least one)
- **Recommended: Option A, the summary endpoint.** It's the easiest and reuses your balance logic.
- **Option C, CSV export, is also quick.** Note that the `/transactions/export` route must be registered **before** `/transactions/:id`, or "export" gets treated as an ID. This is a good "AI got it wrong, I fixed it" example for your write-up.
- Doing 2 options is a cheap way to impress the reviewer.

## Step 6: Demo files (`homework-1/demo/`)
- `run.sh`: installs dependencies and starts the server (`chmod +x`).
- `sample-requests.http` (VS Code REST Client) **or** `sample-requests.sh` (curl). Cover the success cases, every validation error, every filter, and the extra feature.
- `sample-data.json`: a few example transactions, optionally loaded at startup.

## Step 7: Testing (optional, but it earns credit)
- Add a few automated tests (Jest + Supertest, or pytest + httpx) for validation, balance and filters.
- 📸 **Screenshot:** the test run passing.

## Step 8: Documentation
- **`homework-1/README.md`:** your name, date and AI tools, then an overview, features (marking which Task 4 option you chose), architecture and design decisions (from Step 2), and an **"AI-assisted workflow"** section with prompts that worked and did not, plus what you corrected.
- **`homework-1/HOWTORUN.md`:** prerequisites (Node or Python version), install, run, the URL and port, how to run the demo requests, and how to run the tests.

## Step 9: Screenshots (`docs/screenshots/`, at least 3–5)
1. An AI prompt and the code it generated (at least 2 of these)
2. The server running in the terminal
3. A successful POST and GET (curl or Postman)
4. A validation error response
5. Test results, or an example where you corrected the AI

## Step 10: Submit
1. `git add . && git commit && git push origin homework-1-submission`
2. Open a PR into **your fork's `main`** (not the original repository).
3. The PR body should contain: a summary, the features table, AI tools and workflow, challenges, how to verify (copy-paste commands), and **embedded screenshots**.
4. Add **Alexey-Popov** as reviewer and optionally the `homework-1` label.

---

## ✅ Final checklist
- [ ] All 4 base endpoints work, with the correct status codes (200, 201, 400, 404)
- [ ] All validation rules are in place and errors use the required format
- [ ] All 3 filters work, including combined
- [ ] At least 1 Task 4 option is done
- [ ] `.gitignore`, `demo/run.sh`, sample requests and sample data are present
- [ ] README (with author and AI usage) and HOWTORUN are filled in
- [ ] 3–5 or more screenshots are in `docs/screenshots/` and embedded in the PR
- [ ] The PR targets your own fork and has a detailed description
