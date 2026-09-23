#!/usr/bin/env bash
# Descarga solo skills/brag de latent-spaces/brag a una caché gitignored.
# No vendorea el repo (ejemplos, sitio, docs) dentro de El DT.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DEST="${BRAG_SKILL_DIR:-$ROOT/output/.cache/brag}"
MARKER="$DEST/skills/brag/SKILL.md"
REPO="https://github.com/latent-spaces/brag.git"

if [[ -f "$MARKER" ]]; then
  echo "brag skill: $MARKER"
  exit 0
fi

if ! command -v git >/dev/null 2>&1; then
  echo "install-brag: falta git en PATH" >&2
  exit 1
fi

mkdir -p "$(dirname "$DEST")"
if [[ -d "$DEST" ]]; then
  rm -rf "$DEST"
fi

git clone --depth 1 --filter=blob:none --sparse "$REPO" "$DEST"
git -C "$DEST" sparse-checkout set skills/brag

if [[ ! -f "$MARKER" ]]; then
  echo "install-brag: no apareció $MARKER" >&2
  exit 1
fi

echo "brag skill: $MARKER"
echo "Caché en output/ (gitignored). No la copies a .cursor/skills ni la commitees."
echo "Render: Node.js 22+, FFmpeg en PATH, y npx hyperframes doctor dentro de la composición."
