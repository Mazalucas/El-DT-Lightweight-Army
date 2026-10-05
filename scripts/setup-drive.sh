#!/usr/bin/env bash
# setup-drive — ya no instala google-drive-dt.
# Imprime cómo conectar los MCP oficiales, o saca el servidor legado.
# Uso:
#   ./scripts/setup-drive.sh [--ide cursor|antigravity|claude|all]
#   ./scripts/setup-drive.sh --remove-legacy [--ide cursor|antigravity|all]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=lib/force_utf8.sh
. "$(dirname "$(realpath "${BASH_SOURCE[0]}")")/lib/force_utf8.sh"

IDE_TARGET="all"
REMOVE_LEGACY=0
LEGACY_NAME="google-drive-dt"

info() { printf '→ %s\n' "$*" >&2; }
warn() { printf '⚠ %s\n' "$*" >&2; }
die() { printf '✗ %s\n' "$*" >&2; exit 1; }

usage() {
  cat <<EOF
google-drive-dt está descontinuado. El DT usa el MCP oficial de cada IDE.

Uso:
  ./scripts/setup-drive.sh [--ide cursor|antigravity|claude|all]
      Guía de instalación (no pide credenciales).

  ./scripts/setup-drive.sh --remove-legacy [--ide cursor|antigravity|all]
      Saca el servidor "google-drive-dt" de la config MCP local.

Después: /yo → /drive, /gmail o /calendar
Spec: vitals/specs/google-apps-mcp.md
Guía: docs/02_guides/drive-cerebro-setup.md
EOF
}

print_cursor() {
  cat <<'EOF'

Cursor — plugins del marketplace
  /add-plugin google-drive
  /add-plugin gmail
  /add-plugin google-calendar

O en el chat: /drive /gmail /calendar (el DT llama install_plugin).
Autenticá cada plugin. No reinstales @ibarcarty/mcp-server-google-drive.

EOF
}

print_antigravity() {
  cat <<'EOF'

Antigravity — Marketplace o MCP Store primero, después Authenticate.
  Customizations → Marketplace, o Settings → Add MCP / MCP Servers.
  Buscá Gmail, Drive, Calendar.

Si el Store no lista la app, URL oficial (sin bloque oauth):
  Drive:     https://drivemcp.googleapis.com/mcp/v1
  Gmail:     https://gmailmcp.googleapis.com/mcp/v1
  Calendar:  https://calendarmcp.googleapis.com/mcp/v1
  Config: ~/.gemini/config/mcp_config.json

Si no aparece Authenticate, parar. El client OAuth lo da IT.
No recorras Google Cloud Console en el chat. No pongas el secret en el repo.

EOF
}

print_claude() {
  cat <<'EOF'

Claude — Connectors / marketplace del plan
  Settings → Connectors. Conector oficial si existe.
  Si no, custom connector con las mismas URLs que Antigravity.
  Plan que permita conectores.
  Si pide Client ID o no aparece Authenticate, parar: el client lo da IT.
  No recorras Google Cloud Console. No commitear el secret.

EOF
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      -h|--help)
        usage
        exit 0
        ;;
      --remove-legacy)
        REMOVE_LEGACY=1
        shift
        ;;
      --ide)
        [[ $# -ge 2 ]] || die "--ide requiere un valor"
        IDE_TARGET="$(printf '%s' "$2" | tr '[:upper:]' '[:lower:]')"
        shift 2
        ;;
      --apps|--reauth)
        die "Ese flag era del MCP propio (descontinuado). Usá /drive /gmail /calendar o --remove-legacy."
        ;;
      *.json)
        die "Ya no se usa un JSON Desktop. Credenciales las maneja el plugin oficial. Ver --help."
        ;;
      *)
        die "Argumento desconocido: $1 (ver --help)"
        ;;
    esac
  done
  case "$IDE_TARGET" in
    cursor|antigravity|claude|all) ;;
    *) die "--ide debe ser cursor, antigravity, claude o all" ;;
  esac
}

remove_legacy_from_file() {
  local mcp_path="$1"
  if [[ ! -f "$mcp_path" ]]; then
    info "No existe $mcp_path — nada que sacar"
    return 0
  fi
  if ! command -v ruby >/dev/null 2>&1; then
    warn "Ruby no disponible — borrá a mano la clave ${LEGACY_NAME} en $mcp_path"
    return 1
  fi
  ruby - "$mcp_path" "$LEGACY_NAME" <<'RUBY'
require "json"
path, name = ARGV
data = JSON.parse(File.read(path))
servers = data["mcpServers"]
unless servers.is_a?(Hash) && servers.key?(name)
  warn = "→ #{path}: no había #{name}"
  $stderr.puts warn
  exit 0
end
servers.delete(name)
File.write(path, JSON.pretty_generate(data) + "\n")
puts "→ #{path}: saqué #{name}"
RUBY
}

antigravity_mcp_paths() {
  local paths=()
  [[ -d "$HOME/.gemini/config" || -f "$HOME/.gemini/config/mcp_config.json" ]] && paths+=("$HOME/.gemini/config/mcp_config.json")
  [[ -d "$HOME/.gemini/antigravity" || -f "$HOME/.gemini/antigravity/mcp_config.json" ]] && paths+=("$HOME/.gemini/antigravity/mcp_config.json")
  printf '%s\n' "${paths[@]:-}" | awk 'NF && !seen[$0]++'
}

do_remove_legacy() {
  case "$IDE_TARGET" in
    cursor|all)
      remove_legacy_from_file "${CURSOR_MCP_JSON:-$HOME/.cursor/mcp.json}"
      ;;
  esac
  case "$IDE_TARGET" in
    antigravity|all)
      local path found=0
      while IFS= read -r path; do
        [[ -n "$path" ]] || continue
        found=1
        remove_legacy_from_file "$path" || true
      done < <(antigravity_mcp_paths)
      if [[ "$found" -eq 0 ]]; then
        info "No encontré mcp_config de Antigravity"
      fi
      ;;
  esac
  info "Si el oficial ya funciona, podés borrar ~/.config/mcp-server-google-drive/ (confirmá vos)."
}

print_guide() {
  info "MCP propio descontinuado. Instalá el oficial:"
  case "$IDE_TARGET" in
    cursor) print_cursor ;;
    antigravity) print_antigravity ;;
    claude) print_claude ;;
    all)
      print_cursor
      print_antigravity
      print_claude
      ;;
  esac
  cat <<EOF
Después: /yo → /drive, /gmail o /calendar (selector local, no Git).
Sacar el servidor viejo: $0 --remove-legacy
EOF
}

parse_args "$@"
if [[ "$REMOVE_LEGACY" -eq 1 ]]; then
  if [[ "$IDE_TARGET" == "claude" ]]; then
    die "--remove-legacy no aplica a Claude (no escribimos esa config desde acá)"
  fi
  do_remove_legacy
else
  print_guide
fi
