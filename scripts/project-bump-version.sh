#!/usr/bin/env bash
# project-bump-version — incrementa semver en VERSION (raíz).
# Uso: ./scripts/project-bump-version.sh [patch|minor]
# Escribe la nueva versión en stdout.

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
KIND="${1:-patch}"
VERSION_FILE="$ROOT/VERSION"

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
  *)
    echo "Uso: project-bump-version.sh [patch|minor]" >&2
    exit 2
    ;;
esac

NEW="${MA}.${MI}.${PA}"
echo "$NEW" > "$VERSION_FILE"
echo "$NEW"
