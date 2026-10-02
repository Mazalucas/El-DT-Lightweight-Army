#!/usr/bin/env bash
# project-bump-version — incrementa semver en VERSION (raíz).
# Uso: ./scripts/project-bump-version.sh patch|minor|major
# El dígito lo elige /guardar (skill git-guardar). Este script solo suma.
# En consumer aborta si VERSION es la del DT (framework_version): hay que resolver primero.
# Escribe la nueva versión en stdout.

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=lib/force_utf8.sh
. "$(dirname "$(realpath "${BASH_SOURCE[0]}")")/lib/force_utf8.sh"
KIND="${1:-}"
VERSION_FILE="$ROOT/VERSION"

ruby "$ROOT/scripts/project-version.rb" guard --root "$ROOT" >/dev/null

if [[ ! -f "$VERSION_FILE" ]]; then
  echo "ERROR: falta $VERSION_FILE" >&2
  exit 1
fi

CUR="$(tr -d '[:space:]' < "$VERSION_FILE")"
if [[ ! "$CUR" =~ ^([0-9]+)\.([0-9]+)\.([0-9]+)$ ]]; then
  echo "ERROR: VERSION no semver: '$CUR'" >&2
  exit 1
fi

MA="${BASH_REMATCH[1]}"
MI="${BASH_REMATCH[2]}"
PA="${BASH_REMATCH[3]}"

case "$KIND" in
  patch) PA=$((PA + 1)) ;;
  minor) MI=$((MI + 1)); PA=0 ;;
  major) MA=$((MA + 1)); MI=0; PA=0 ;;
  *)
    echo "Uso: project-bump-version.sh patch|minor|major" >&2
    exit 2
    ;;
esac

NEW="${MA}.${MI}.${PA}"
echo "$NEW" > "$VERSION_FILE"
echo "$NEW"
