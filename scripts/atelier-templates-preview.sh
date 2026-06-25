#!/usr/bin/env bash
# DEPRECATED — utilidad humana opcional. Las skills Atelier usan Markdown-only (templates/PROTOCOL.md).
# Abre galería HTML legacy en el navegador vía HTTP local.
# Uso legacy: ./scripts/atelier-templates-preview.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TEMPLATES="$ROOT/.cursor/skills/design/templates"
PREVIEW="$TEMPLATES/preview/index.html"
PORT="${ATELIER_PREVIEW_PORT:-8765}"

if [[ ! -f "$PREVIEW" ]]; then
  echo "atelier-templates-preview: no existe $PREVIEW" >&2
  exit 1
fi

if [[ ! -f "$TEMPLATES/shared/document-experience.css" ]]; then
  echo "atelier-templates-preview: aviso — document-experience.css ausente; galería puede verse sin estilos." >&2
fi

URL="http://127.0.0.1:${PORT}/preview/index.html"

if ! lsof -i ":${PORT}" -sTCP:LISTEN >/dev/null 2>&1; then
  cd "$TEMPLATES"
  python3 -m http.server "$PORT" >/dev/null 2>&1 &
  echo "Servidor Atelier en $URL (pid $! — kill $! para detener)"
  sleep 0.5
else
  echo "Servidor Atelier ya escuchando en puerto $PORT"
fi

case "$(uname -s)" in
  Darwin) open "$URL" ;;
  Linux) xdg-open "$URL" 2>/dev/null || sensible-browser "$URL" 2>/dev/null || echo "Abrir: $URL" ;;
  MINGW*|MSYS*|CYGWIN*) start "" "$URL" ;;
  *) echo "Abrir en el navegador: $URL" ;;
esac
