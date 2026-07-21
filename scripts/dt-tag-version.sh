#!/usr/bin/env bash
# dt-tag-version — tag anotado vX.Y.Z según VERSION en raíz (releases del template DT).
# Uso: ./scripts/dt-tag-version.sh [--push] [--message "texto"]
# Exit 0: tag OK o ya existía en HEAD. Exit 1: tag en otro commit o VERSION inválida.

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PUSH=false
MSG=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --push) PUSH=true; shift ;;
    --message) MSG="${2:-}"; shift 2 ;;
    *) echo "Uso: dt-tag-version.sh [--push] [--message \"texto\"]" >&2; exit 2 ;;
  esac
done

VERSION_FILE="$ROOT/VERSION"
if [[ ! -f "$VERSION_FILE" ]]; then
  echo "ERROR: falta $VERSION_FILE" >&2
  exit 1
fi

VERSION="$(tr -d '[:space:]' < "$VERSION_FILE")"
if [[ ! "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "ERROR: VERSION no semver: '$VERSION'" >&2
  exit 1
fi

TAG="v${VERSION}"
cd "$ROOT"

if git rev-parse "$TAG" >/dev/null 2>&1; then
  TAG_COMMIT="$(git rev-list -n 1 "$TAG")"
  HEAD_COMMIT="$(git rev-parse HEAD)"
  if [[ "$TAG_COMMIT" == "$HEAD_COMMIT" ]]; then
    echo "OK: $TAG ya apunta a HEAD"
  else
    echo "ERROR: $TAG existe en $(git rev-parse --short "$TAG_COMMIT)), HEAD es $(git rev-parse --short HEAD)" >&2
    echo "Bump VERSION o borrar/recrear tag solo con acuerdo explícito (no force en main)." >&2
    exit 1
  fi
else
  BODY="${MSG:-El DT template ${VERSION}}"
  git tag -a "$TAG" -m "$BODY"
  echo "created $TAG on $(git rev-parse --short HEAD)"
fi

if $PUSH; then
  git push origin "$TAG"
  echo "pushed origin $TAG"
fi
