#!/usr/bin/env bash
# Arranca emuladores Firebase + Vite para testear Cerebro App en local.
# Uso: ./scripts/dev-cerebro-local.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP="$ROOT/modules/cerebro-app"
LOG="$APP/.local/emulators.log"
PIDFILE="$APP/.local/emulators.pid"

mkdir -p "$APP/.local"

if ! command -v firebase >/dev/null 2>&1; then
  echo "Instalá Firebase CLI: npm install -g firebase-tools"
  exit 1
fi

if [[ ! -d "$APP/src/node_modules" ]]; then npm install --prefix "$APP/src"; fi
if [[ ! -d "$APP/functions/node_modules" ]]; then npm install --prefix "$APP/functions"; fi

npm run build --prefix "$APP/functions"

stop_emulators() {
  if [[ -f "$PIDFILE" ]]; then
    local pid
    pid="$(cat "$PIDFILE")"
    if kill -0 "$pid" 2>/dev/null; then
      echo "Deteniendo emuladores (pid $pid)…"
      kill "$pid" 2>/dev/null || true
      sleep 1
    fi
    rm -f "$PIDFILE"
  fi
}

if [[ "${1:-}" == "--stop" ]]; then
  stop_emulators
  exit 0
fi

# Evitar duplicar emuladores
if [[ -f "$PIDFILE" ]] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then
  echo "Emuladores ya corriendo (pid $(cat "$PIDFILE")). Usá --stop para cerrarlos."
else
  stop_emulators
  echo "Iniciando emuladores Firebase… (log: $LOG)"
  (
    cd "$APP"
    firebase emulators:start --project demo-cerebro --only auth,functions,firestore,storage
  ) >"$LOG" 2>&1 &
  echo $! >"$PIDFILE"

  echo -n "Esperando emuladores"
  for _ in $(seq 1 90); do
    auth_up=false
    api_up=false
    curl -sf "http://127.0.0.1:9099/" >/dev/null 2>&1 && auth_up=true
    curl -sf "http://127.0.0.1:5001/demo-cerebro/europe-west1/api/api/health" >/dev/null 2>&1 && api_up=true
    if $auth_up && $api_up; then
      echo " OK"
      break
    fi
    echo -n "."
    sleep 1
  done
  echo ""
fi

echo ""
echo "══════════════════════════════════════════════"
echo "  Cerebro App — entorno local"
echo "══════════════════════════════════════════════"
echo "  App (Vite):     http://localhost:5190"
echo "  Emulator UI:    http://localhost:4000"
echo "  Auth emulator: http://127.0.0.1:9099"
echo ""
echo "  Login: botón «Entrar (dev local)»"
echo "  Sync Drive: requiere GOOGLE_OAUTH_* en functions/.env"
echo "  Parar todo:     ./scripts/dev-cerebro-local.sh --stop && /exit"
echo "══════════════════════════════════════════════"
echo ""

cd "$APP"
exec npm run dev --prefix src
