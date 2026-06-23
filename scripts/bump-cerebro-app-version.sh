#!/usr/bin/env bash
# Incrementa APP_VERSION (+1) en front y back desde modules/cerebro-app/VERSION
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP="$ROOT/modules/cerebro-app"
VERSION_FILE="$APP/VERSION"

if [[ ! -f "$VERSION_FILE" ]]; then
  echo "1" > "$VERSION_FILE"
fi

current="$(tr -d '[:space:]' < "$VERSION_FILE")"
if ! [[ "$current" =~ ^[0-9]+$ ]]; then
  echo "bump-cerebro-app-version: VERSION inválido ($current)" >&2
  exit 1
fi

next=$((current + 1))
printf '%s\n' "$next" > "$VERSION_FILE"

write_ts() {
  local dest="$1"
  cat > "$dest" <<EOF
/** Auto-generated from VERSION — edit via scripts/bump-cerebro-app-version.sh */
export const APP_VERSION = ${next};
EOF
}

write_ts "$APP/shared/app-version.ts"
write_ts "$APP/functions/src/lib/app-version.ts"

echo "APP_VERSION: ${current} → ${next}"
