#!/usr/bin/env bash
# Starts the Banking Transactions API.
#
#   ./demo/run.sh                 start on port 3000 with an empty store
#   ./demo/run.sh --sample-data   start with demo/sample-data.json preloaded
#   PORT=3100 ./demo/run.sh       use another port
#
# Works from any directory. Installs dependencies on the first run.

set -euo pipefail

cd "$(dirname "$0")/.."   # project root (homework-1/)

for arg in "$@"; do
  case "$arg" in
    --sample-data) export LOAD_SAMPLE_DATA=true ;;
    -h|--help) sed -n '2,8p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "Unknown option: $arg (try --help)" >&2; exit 1 ;;
  esac
done

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is not installed. Install Node 18 or newer from https://nodejs.org" >&2
  exit 1
fi

NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]")
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "Node 18 or newer is required (found $(node -v))." >&2
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "Installing dependencies..."
  npm install --no-audit --no-fund
fi

PORT="${PORT:-3000}"
if command -v lsof >/dev/null 2>&1 && lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Port $PORT is already in use (maybe an old server is still running)." >&2
  echo "Stop it, or use another port:  PORT=3100 ./demo/run.sh" >&2
  exit 1
fi

export PORT
exec npm start
