#!/usr/bin/env bash
# dt-doctor — verificador read-only del orden del repo DT (motor del loop).
# Uso: ./scripts/dt-doctor.sh [--quiet]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=lib/force_utf8.sh
. "$(dirname "$(realpath "${BASH_SOURCE[0]}")")/lib/force_utf8.sh"
cd "$ROOT"

if ! command -v ruby >/dev/null 2>&1; then
  echo "dt-doctor: se requiere Ruby (psych/YAML)." >&2
  exit 1
fi

exec ruby "$ROOT/scripts/dt-doctor.rb" "$@"
