#!/usr/bin/env bash
# Task 4 sample requests (Option A: summary, Option C: CSV export).
# Start the API first (npm start), then run:  ./demo/sample-requests-task4.sh
# Another port?  BASE_URL=http://localhost:3100 ./demo/sample-requests-task4.sh

BASE_URL="${BASE_URL:-http://localhost:3000}"
JSON='Content-Type: application/json'

section() { printf '\n\033[1m=== %s ===\033[0m\n' "$1"; }
post() { curl -s -o /dev/null -w "  POST /transactions -> %{http_code}\n" -X POST "$BASE_URL/transactions" -H "$JSON" -d "$1"; }

section "SETUP: create transactions for ACC-12345 / ACC-67890"
post '{"toAccount":"ACC-12345","amount":500,"currency":"USD","type":"deposit"}'
post '{"toAccount":"ACC-12345","amount":250.25,"currency":"USD","type":"deposit"}'
post '{"toAccount":"ACC-12345","amount":20,"currency":"EUR","type":"deposit"}'
post '{"fromAccount":"ACC-12345","toAccount":"ACC-67890","amount":100.50,"currency":"USD","type":"transfer"}'
post '{"fromAccount":"ACC-12345","amount":50,"currency":"USD","type":"withdrawal"}'

section "OPTION A: summary of ACC-12345 (deposits, withdrawals, count, most recent date)"
curl -s "$BASE_URL/accounts/ACC-12345/summary"; echo

section "OPTION A: summary of ACC-67890 (only received a transfer)"
curl -s "$BASE_URL/accounts/ACC-67890/summary"; echo

section "OPTION A: summary of an account without transactions"
curl -s "$BASE_URL/accounts/ACC-00000/summary"; echo

section "OPTION C: export all transactions as CSV (with headers)"
curl -s -i "$BASE_URL/transactions/export?format=csv"

section "OPTION C: export filtered (transfers only)"
curl -s "$BASE_URL/transactions/export?format=csv&type=transfer"

section "OPTION C: export one account"
curl -s "$BASE_URL/transactions/export?format=csv&accountId=ACC-12345"

section "OPTION C: save to a file"
curl -s -o transactions.csv "$BASE_URL/transactions/export?format=csv" && echo "  saved transactions.csv ($(wc -l < transactions.csv | tr -d ' ') lines)" && rm -f transactions.csv

section "OPTION C: unsupported format -> 400"
curl -s -w '\n  [%{http_code}]\n' "$BASE_URL/transactions/export?format=xml"

section "OPTION C: invalid format and filter -> both errors"
curl -s -w '\n  [%{http_code}]\n' "$BASE_URL/transactions/export?format=xml&type=gift"
