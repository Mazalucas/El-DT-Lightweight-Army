#!/usr/bin/env bash
# project-resolve-version — en consumer, VERSION del producto nunca es framework_version del DT.
# Uso: ./scripts/project-resolve-version.sh [--dry-run]
# Spec: vitals/specs/project-version.md
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
exec ruby "$ROOT/scripts/project-version.rb" resolve --root "$ROOT" "$@"
