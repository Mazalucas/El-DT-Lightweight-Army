#!/usr/bin/env bash
# Cierra dev servers Vite de módulos Cerebro Prime (puertos conocidos).
# Uso: ./scripts/stop-dev-servers.sh [--dry-run]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DRY_RUN=false
[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=true

stopped=()
skipped=()
seen_pids=()

already_seen() {
  local pid="$1"
  local s
  for s in "${seen_pids[@]:-}"; do
    [[ "$s" == "$pid" ]] && return 0
  done
  return 1
}

mark_seen() {
  seen_pids+=("$1")
}

kill_if_ours() {
  local pid="$1" port="$2" marker="$3" label="$4"
  local args

  if already_seen "$pid"; then
    return 0
  fi

  args="$(ps -p "$pid" -o args= 2>/dev/null || true)"
  [[ -z "$args" ]] && return 0

  if ! echo "$args" | grep -qE "${marker}|${ROOT}/modules/${marker}"; then
    skipped+=(":$port pid $pid (otra app)")
    return 0
  fi

  mark_seen "$pid"

  if [[ "$DRY_RUN" == true ]]; then
    echo "exit: [dry-run] cerraría $label (:$port, pid $pid)"
    stopped+=("$label (:$port, pid $pid)")
    return 0
  fi

  if kill "$pid" 2>/dev/null; then
    echo "exit: cerrado $label (:$port, pid $pid)"
    stopped+=("$label (:$port)")
  else
    echo "exit: no se pudo cerrar pid $pid ($label)" >&2
  fi
}

stop_port() {
  local port="$1" marker="$2" label="$3"
  local pid

  if ! command -v lsof >/dev/null 2>&1; then
    echo "exit: lsof no encontrado — no se pueden detectar procesos por puerto." >&2
    return 1
  fi

  while read -r pid; do
    [[ -z "$pid" ]] && continue
    kill_if_ours "$pid" "$port" "$marker" "$label"
  done < <(lsof -ti :"$port" 2>/dev/null || true)
}

stop_port 5173 facturas-autonomo-es "Facturas autónomo"
stop_port 5180 tools-hub "Tools Hub"
stop_port 5181 recordatorios "Recordatorios"
stop_port 5182 cerebro-profesional "Cerebro profesional"
stop_port 5190 cerebro-app "Cerebro App"

# Vite/node huérfanos bajo modules/ (puerto alternativo de Vite)
if command -v pgrep >/dev/null 2>&1; then
  while read -r pid; do
    [[ -z "$pid" ]] && continue
    args="$(ps -p "$pid" -o args= 2>/dev/null || true)"
    [[ -z "$args" ]] && continue
    if echo "$args" | grep -qE "${ROOT}/modules/(tools-hub|recordatorios|cerebro-profesional|cerebro-app|facturas-autonomo-es)" \
      && echo "$args" | grep -qE 'vite|npm run dev'; then
      marker="$(echo "$args" | grep -oE 'modules/[^/]+' | head -1 | sed 's|modules/||')"
      kill_if_ours "$pid" "?" "${marker}" "${marker:-módulo}"
    fi
  done < <(pgrep -f "${ROOT}/modules/" 2>/dev/null || true)
fi

if [[ ${#stopped[@]} -eq 0 ]]; then
  echo "exit: no había dev servers de Cerebro Prime en ejecución."
else
  echo "exit: ${#stopped[@]} proceso(s) cerrado(s)."
fi

if [[ ${#skipped[@]} -gt 0 ]]; then
  echo "exit: omitidos (puerto ocupado por otra app):"
  printf '  - %s\n' "${skipped[@]}"
fi
