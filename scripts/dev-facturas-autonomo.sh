#!/usr/bin/env bash
# Arranca la app de facturas autónomo (Vite dev server).
# Uso: ./scripts/dev-facturas-autonomo.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP="$ROOT/modules/facturas-autonomo-es/src"

if [[ ! -f "$APP/package.json" ]]; then
  echo "dev-facturas-autonomo: no existe $APP/package.json" >&2
  exit 1
fi

cd "$APP"

if ! command -v npm >/dev/null 2>&1; then
  echo "dev-facturas-autonomo: npm no encontrado. Instalá Node.js LTS." >&2
  exit 1
fi

if [[ ! -d node_modules ]]; then
  echo "dev-facturas-autonomo: instalando dependencias..."
  npm install
fi

# Mismo puerto siempre: IndexedDB es distinto por origen (5173 ≠ 5174).
if command -v lsof >/dev/null 2>&1; then
  while read -r pid; do
    [[ -z "$pid" ]] && continue
    if ps -p "$pid" -o args= 2>/dev/null | grep -q 'facturas-autonomo-es'; then
      echo "dev-facturas-autonomo: cerrando instancia anterior en :5173 (pid $pid)"
      kill "$pid" 2>/dev/null || true
    fi
  done < <(lsof -ti :5173 2>/dev/null || true)
  sleep 0.3
fi

echo "dev-facturas-autonomo: iniciando Vite en $APP (http://localhost:5173/)"
exec npm run dev
