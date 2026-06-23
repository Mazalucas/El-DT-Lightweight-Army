#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/modules/cerebro-app"
if [[ ! -d src/node_modules ]]; then npm install --prefix src; fi
if [[ ! -d functions/node_modules ]]; then npm install --prefix functions; fi
echo "Cerebro App → http://localhost:5190 (API via emulador :5001 si está activo)"
npm run dev --prefix src
