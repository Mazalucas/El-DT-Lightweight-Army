#!/usr/bin/env bash
# Sincroniza commands de rutina (.cursor/commands, .agents/workflows) desde commands-meta.yaml
# Uso: ./scripts/sync-commands-from-meta.sh [--check]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v ruby >/dev/null 2>&1; then
  echo "sync-commands-from-meta: se requiere Ruby (psych/YAML)." >&2
  exit 1
fi

exec ruby "$ROOT/scripts/sync-commands-from-meta.rb" "$@"
