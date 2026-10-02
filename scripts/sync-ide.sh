#!/usr/bin/env bash
# sync-ide — emisor único multi-IDE del DT (rules, skills, commands, punteros).
# Recorre vitals/config/ide-targets.yaml. Uso: ./scripts/sync-ide.sh [--check]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=lib/force_utf8.sh
. "$(dirname "$(realpath "${BASH_SOURCE[0]}")")/lib/force_utf8.sh"
cd "$ROOT"

if ! command -v ruby >/dev/null 2>&1; then
  echo "sync-ide: se requiere Ruby (psych/YAML)." >&2
  exit 1
fi

exec ruby "$ROOT/scripts/sync-ide.rb" "$@"
