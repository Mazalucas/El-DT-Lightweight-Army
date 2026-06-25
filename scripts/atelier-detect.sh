#!/usr/bin/env bash
# atelier-detect — Impeccable CLI wrapper (deterministic anti-slop, no LLM).
#
# Uso:
#   ./scripts/atelier-detect.sh src/
#   ./scripts/atelier-detect.sh path/to/file.tsx
#   ./scripts/atelier-detect.sh --json src/
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ATELIER="$ROOT/tools/atelier"
CLI="$ATELIER/node_modules/.bin/impeccable"
CONFIG="$ROOT/vitals/data/design/atelier-detector.yaml"

if [[ ! -x "$CLI" ]]; then
  echo "atelier-detect: impeccable CLI not installed. Run: cd tools/atelier && npm install" >&2
  exit 1
fi

ARGS=()
HAS_CONFIG=false
for arg in "$@"; do
  if [[ "$arg" == "--no-config" ]]; then HAS_CONFIG=true; fi
  ARGS+=("$arg")
done

if ! $HAS_CONFIG && [[ -f "$CONFIG" ]]; then
  exec "$CLI" detect "${ARGS[@]}" --config "$CONFIG"
fi

exec "$CLI" detect "${ARGS[@]}"
