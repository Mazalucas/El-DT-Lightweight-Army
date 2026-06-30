#!/usr/bin/env bash
# Serve Atelier human preview (tools/atelier/preview/).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PREVIEW="$ROOT/preview"
PORT="${ATELIER_PREVIEW_PORT:-8765}"
URL="http://127.0.0.1:${PORT}/"

if [[ ! -f "$PREVIEW/index.html" ]]; then
  echo "serve-preview: missing $PREVIEW/index.html" >&2
  exit 1
fi

if lsof -i ":${PORT}" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Atelier preview already on port $PORT"
else
  cd "$PREVIEW"
  python3 -m http.server "$PORT" >/dev/null 2>&1 &
  echo "Atelier preview: $URL (pid $! — kill $! to stop)"
  sleep 0.4
fi

case "$(uname -s)" in
  Darwin) open "$URL" ;;
  Linux) xdg-open "$URL" 2>/dev/null || echo "Open: $URL" ;;
  *) echo "Open: $URL" ;;
esac
