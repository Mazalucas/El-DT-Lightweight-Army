#!/usr/bin/env bash
# Arranca la app de recordatorios (Vite dev server, puerto 5181).
# Uso: ./scripts/dev-recordatorios.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP="$ROOT/modules/recordatorios/src"

if [[ ! -f "$APP/package.json" ]]; then
  echo "dev-recordatorios: no existe $APP/package.json" >&2
  exit 1
fi

cd "$APP"

if ! command -v npm >/dev/null 2>&1; then
  echo "dev-recordatorios: npm no encontrado. Instalá Node.js LTS." >&2
  exit 1
fi

if [[ ! -d node_modules ]]; then
  echo "dev-recordatorios: instalando dependencias..."
  npm install
fi

echo "dev-recordatorios: iniciando Vite en $APP (puerto 5181)"
exec npm run dev
