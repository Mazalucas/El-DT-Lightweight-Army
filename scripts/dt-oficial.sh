#!/usr/bin/env bash
# /oficial — marcar, apagar o inspeccionar el checkout que puede publicar al DT.
# Uso: ./scripts/dt-oficial.sh status|activate [--yes]|off|install-hook
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=lib/force_utf8.sh
. "$(dirname "$(realpath "${BASH_SOURCE[0]}")")/lib/force_utf8.sh"
exec ruby "$ROOT/scripts/dt-canonical-publish.rb" "$@"
