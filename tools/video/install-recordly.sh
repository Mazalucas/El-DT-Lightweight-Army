#!/usr/bin/env bash
# Baja el binario oficial de Recordly a una caché gitignored.
# No clona el repo (AGPL, cientos de MB) ni lo copia a tools/.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DEST="${RECORDLY_CACHE_DIR:-$ROOT/output/.cache/recordly}"
API="https://api.github.com/repos/webadderallorg/Recordly/releases/latest"
RELEASES="https://github.com/webadderallorg/Recordly/releases"

if [[ "$(uname -s)" == "Darwin" && -d "/Applications/Recordly.app" ]]; then
  echo "Recordly: /Applications/Recordly.app"
  exit 0
fi

os="$(uname -s)"
arch="$(uname -m)"
case "${os}-${arch}" in
  Darwin-arm64) asset="Recordly-arm64.dmg" ;;
  Darwin-x86_64) asset="Recordly-x64.dmg" ;;
  Linux-x86_64) asset="Recordly-linux-x64.AppImage" ;;
  MINGW*-*|MSYS*-*|CYGWIN*-*) asset="Recordly-windows-x64.exe" ;;
  *)
    echo "install-recordly: plataforma ${os} ${arch} sin asset conocido." >&2
    echo "Releases: ${RELEASES}" >&2
    exit 1
    ;;
esac

mkdir -p "$DEST"
target="$DEST/$asset"

if [[ ! -f "$target" ]]; then
  url="$(
    curl -fsSL "$API" | python3 -c '
import json, sys
name = sys.argv[1]
rel = json.load(sys.stdin)
for item in rel.get("assets", []):
    if item.get("name") == name:
        print(item["browser_download_url"])
        raise SystemExit(0)
raise SystemExit(1)
' "$asset"
  )"
  curl -fL --retry 3 -o "$target.partial" "$url"
  mv "$target.partial" "$target"
fi

echo "Recordly: $target"
echo "Caché en output/ (gitignored). No la copies al repo ni clones el fuente."

if [[ "$asset" == *.dmg ]]; then
  echo "Abrí el dmg y arrastrá Recordly a /Applications. Después grabá vos la toma."
  open "$target" || true
elif [[ "$asset" == *.AppImage ]]; then
  chmod +x "$target"
fi
