#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP="$ROOT/modules/cerebro-profesional/src"
cd "$APP"
if [[ ! -d node_modules ]]; then npm install; fi
echo "dev-cerebro-profesional: puerto 5182"
exec npm run dev
