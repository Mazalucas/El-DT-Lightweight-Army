#!/usr/bin/env bash
# /oficial — marcar, apagar o inspeccionar el checkout que puede publicar al DT.
# Uso: ./scripts/dt-oficial.sh status|activate [--yes]|off|install-hook
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
exec ruby "$ROOT/scripts/dt-canonical-publish.rb" "$@"
