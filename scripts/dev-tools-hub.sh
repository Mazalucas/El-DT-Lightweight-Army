#!/usr/bin/env bash
# Arranca Tools Hub (índice interactivo de herramientas).
# Uso: ./scripts/dev-tools-hub.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP="$ROOT/modules/tools-hub/src"

if [[ ! -f "$APP/package.json" ]]; then
  echo "dev-tools-hub: no existe $APP/package.json" >&2
  exit 1
fi

cd "$APP"

if ! command -v npm >/dev/null 2>&1; then
  echo "dev-tools-hub: npm no encontrado. Instalá Node.js LTS." >&2
  exit 1
fi

if [[ ! -d node_modules ]]; then
  echo "dev-tools-hub: instalando dependencias..."
  npm install
fi

echo "dev-tools-hub: iniciando Vite en $APP (puerto 5180)"
exec npm run dev
