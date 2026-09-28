#!/usr/bin/env bash
# Publica en GitHub Releases la entrada de CHANGELOG.md de la VERSION actual.
# El tag vX.Y.Z ya tiene que existir en origin. No crea tags.
# Uso: ./scripts/dt-publish-github-release.sh

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

VERSION="$(tr -d '[:space:]' < "$ROOT/VERSION")"
if [[ ! "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "ERROR: VERSION no semver: '$VERSION'" >&2
  exit 1
fi

TAG="v${VERSION}"
CHANGELOG="$ROOT/CHANGELOG.md"
if [[ ! -f "$CHANGELOG" ]]; then
  echo "ERROR: falta CHANGELOG.md" >&2
  exit 1
fi

if ! git rev-parse -q --verify "refs/tags/${TAG}" >/dev/null; then
  echo "ERROR: no existe el tag ${TAG}. Corré dt-tag-version.sh antes." >&2
  exit 1
fi

if ! git ls-remote --exit-code --tags origin "refs/tags/${TAG}" >/dev/null 2>&1; then
  echo "ERROR: ${TAG} no está en origin. Pusheá el tag antes de la release." >&2
  exit 1
fi

NOTES="$(mktemp)"
trap 'rm -f "$NOTES"' EXIT

awk -v ver="$VERSION" '
  $0 ~ "^## \\[" ver "\\]" { found=1; print; next }
  found && /^## / { exit }
  found { print }
' "$CHANGELOG" > "$NOTES"

if [[ ! -s "$NOTES" ]]; then
  echo "ERROR: CHANGELOG.md no tiene una entrada ## [${VERSION}]" >&2
  exit 1
fi

if gh release view "$TAG" >/dev/null 2>&1; then
  gh release edit "$TAG" --title "$TAG" --notes-file "$NOTES"
  echo "updated GitHub release $TAG"
else
  gh release create "$TAG" --title "$TAG" --notes-file "$NOTES"
  echo "created GitHub release $TAG"
fi
