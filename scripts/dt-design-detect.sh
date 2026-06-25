#!/usr/bin/env bash
# DEPRECATED: use ./scripts/atelier-detect.sh (Impeccable CLI, 44+ rules).
# Thin alias for backward compatibility — one release cycle.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
echo "dt-design-detect: deprecated — use ./scripts/atelier-detect.sh" >&2

if [[ -x "$ROOT/scripts/atelier-detect.sh" ]]; then
  exec "$ROOT/scripts/atelier-detect.sh" "$@"
fi

echo "dt-design-detect: atelier-detect.sh not found" >&2
exit 1
