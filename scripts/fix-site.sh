#!/usr/bin/env bash
# Run when the dev server shows errors like "Cannot find module './627.js'"
# or the site stops updating after you make changes.

set -e

cd "$(dirname "$0")/.."

echo ""
echo "  Fixing your prototype site..."
echo "  (Safe to run — only clears temporary cache and restarts the server.)"
echo ""

for port in 3000 3001; do
  if lsof -ti:"$port" >/dev/null 2>&1; then
    echo "  Stopping old server on port $port..."
    lsof -ti:"$port" | xargs kill -9 2>/dev/null || true
  fi
done

echo "  Clearing cache (.next folder)..."
rm -rf .next

echo "  Installing dependencies..."
npm install

echo "  Verifying the site builds..."
npm run build

echo ""
echo "  All good! Starting dev server..."
echo "  Open the localhost URL shown below (usually http://localhost:3000)."
echo ""

npm run dev
