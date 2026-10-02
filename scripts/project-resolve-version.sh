#!/usr/bin/env bash
# project-resolve-version — en consumer, VERSION del producto nunca es framework_version del DT.
# Uso: ./scripts/project-resolve-version.sh [--dry-run]
# Spec: vitals/specs/project-version.md
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=lib/force_utf8.sh
. "$(dirname "$(realpath "${BASH_SOURCE[0]}")")/lib/force_utf8.sh"
exec ruby "$ROOT/scripts/project-version.rb" resolve --root "$ROOT" "$@"
