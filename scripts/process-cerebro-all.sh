#!/usr/bin/env bash
# Sync Meet notes + procesar todas las reuniones + actualizar cerebro-store.json
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
echo "[cerebro] Sync Meet…"
./scripts/sync-meet-notes.sh "$@" || true
echo "[cerebro] Procesar 118 reuniones…"
node modules/cerebro-profesional/scripts/process-all-meetings.mjs
echo "[cerebro] Listo. Abrí http://localhost:5182/ y recargá."
