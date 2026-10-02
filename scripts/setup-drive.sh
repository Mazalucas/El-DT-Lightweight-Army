#!/usr/bin/env bash
# setup-drive — Instalador idempotente del MCP Google (Drive / Gmail / Calendar) para El DT.
# Credenciales y tokens quedan en ~/.config/ (nunca en el repo).
# Uso:
#   ./scripts/setup-drive.sh [ruta/al/dt-drive-credentials.json] [--apps drive|gmail|calendar|all] [--ide cursor|antigravity|all] [--reauth]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=lib/force_utf8.sh
. "$(dirname "$(realpath "${BASH_SOURCE[0]}")")/lib/force_utf8.sh"
CONFIG_DIR="${GDRIVE_MCP_CONFIG_DIR:-$HOME/.config/mcp-server-google-drive}"
OAUTH_PATH="${GDRIVE_MCP_OAUTH_PATH:-$CONFIG_DIR/oauth-credentials.json}"
TOKEN_PATH="${GDRIVE_MCP_TOKEN_PATH:-$CONFIG_DIR/tokens.json}"
MCP_SERVER_NAME="google-drive-dt"
IDE_TARGET="all"
APPS_ARG="drive"
FORCE_REAUTH=0
SCOPES=""

SCOPE_DRIVE="https://www.googleapis.com/auth/drive.readonly"
SCOPE_GMAIL_RO="https://www.googleapis.com/auth/gmail.readonly"
SCOPE_GMAIL_COMPOSE="https://www.googleapis.com/auth/gmail.compose"
SCOPE_CALENDAR="https://www.googleapis.com/auth/calendar"

info() { printf '→ %s\n' "$*" >&2; }
warn() { printf '⚠ %s\n' "$*" >&2; }
die() { printf '✗ %s\n' "$*" >&2; exit 1; }

usage() {
  cat <<EOF
Uso: ./scripts/setup-drive.sh [ruta/credenciales.json] [--apps LISTA] [--ide cursor|antigravity|all] [--reauth]

  --apps drive            Solo Drive lectura (default, compatible con /drive viejo)
  --apps gmail            Gmail lectura + borradores
  --apps calendar         Calendar
  --apps drive,gmail      Unión (coma o 'all' = las tres)
  --ide cursor            Solo ~/.cursor/mcp.json
  --ide antigravity       Solo config MCP de Antigravity (~/.gemini/...)
  --ide all               Ambos (default)
  --reauth                Borrar token local y volver a abrir el navegador

Un token OAuth para las tres apps. Preguntá en el chat si es una o todas (vitals/specs/google-apps-mcp.md).
Guía: docs/02_guides/drive-cerebro-setup.md
EOF
}

normalize_apps() {
  local raw="${1:-drive}"
  raw="$(printf '%s' "$raw" | tr '[:upper:]' '[:lower:]' | tr ' ' ',')"
  if [[ "$raw" == "all" || "$raw" == "todas" || "$raw" == "tres" ]]; then
    printf '%s' "drive,gmail,calendar"
    return
  fi
  printf '%s' "$raw"
}

build_scopes() {
  local apps="$1"
  local -a out=()
  local part
  IFS=',' read -ra parts <<< "$apps"
  for part in "${parts[@]}"; do
    part="${part// /}"
    [[ -z "$part" ]] && continue
    case "$part" in
      drive) out+=("$SCOPE_DRIVE") ;;
      gmail) out+=("$SCOPE_GMAIL_RO" "$SCOPE_GMAIL_COMPOSE") ;;
      calendar) out+=("$SCOPE_CALENDAR") ;;
      *) die "App desconocida en --apps: $part (usar drive, gmail, calendar o all)" ;;
    esac
  done
  local seen=""
  local s
  local -a uniq=()
  for s in "${out[@]}"; do
    case " $seen " in
      *" $s "*) ;;
      *)
        seen+=" $s"
        uniq+=("$s")
        ;;
    esac
  done
  local IFS=','
  printf '%s' "${uniq[*]}"
}

parse_args() {
  local creds=""
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --ide)
        [[ $# -ge 2 ]] || die "Falta valor para --ide"
        IDE_TARGET="$2"
        shift 2
        ;;
      --apps)
        [[ $# -ge 2 ]] || die "Falta valor para --apps"
        APPS_ARG="$2"
        shift 2
        ;;
      --reauth)
        FORCE_REAUTH=1
        shift
        ;;
      -h|--help)
        usage
        exit 0
        ;;
      *)
        if [[ -z "$creds" ]]; then
          creds="$1"
        else
          die "Argumento desconocido: $1"
        fi
        shift
        ;;
    esac
  done
  case "$IDE_TARGET" in
    cursor|antigravity|all) ;;
    *) die "Valor inválido para --ide: $IDE_TARGET (usar cursor, antigravity o all)" ;;
  esac
  APPS_ARG="$(normalize_apps "$APPS_ARG")"
  SCOPES="$(build_scopes "$APPS_ARG")"
  CREDENTIALS_ARG="$creds"
}

require_node() {
  if ! command -v node >/dev/null 2>&1; then
    die "Se requiere Node.js 18+. Instalá Node y volvé a intentar."
  fi
  local major
  major="$(node -p "process.versions.node.split('.')[0]")"
  if [[ "$major" -lt 18 ]]; then
    die "Se requiere Node.js 18+ (detectado: $(node -v))."
  fi
}

resolve_credentials_path() {
  local arg_path="${CREDENTIALS_ARG:-}"
  if [[ -n "$arg_path" ]]; then
    [[ -f "$arg_path" ]] || die "No existe el archivo de credenciales: $arg_path"
    printf '%s' "$arg_path"
    return
  fi
  if [[ -f "$OAUTH_PATH" ]]; then
    info "Ya existen credenciales en $OAUTH_PATH"
    printf '%s' "$OAUTH_PATH"
    return
  fi
  local default_name="dt-drive-credentials.json"
  read -r -p "Ruta al JSON de credenciales OAuth de la empresa [$default_name]: " input
  input="${input:-$default_name}"
  [[ -f "$input" ]] || die "No existe: $input"
  printf '%s' "$input"
}

install_credentials() {
  local src="$1"
  mkdir -p "$CONFIG_DIR"
  cp "$src" "$OAUTH_PATH"
  chmod 600 "$OAUTH_PATH"
  info "Credenciales instaladas en $OAUTH_PATH"
}

token_missing_scopes() {
  local token_path="$1"
  local needed="$2"
  if ! command -v ruby >/dev/null 2>&1; then
    printf '%s' "ruby-missing"
    return
  fi
  ruby - "$token_path" "$needed" <<'RUBY'
require "json"
path, needed = ARGV
begin
  data = JSON.parse(File.read(path))
rescue StandardError
  puts "unreadable"
  exit 0
end
have = (data["scope"] || "").split(/\s+/)
need = needed.split(",").map(&:strip).reject(&:empty?)
missing = need - have
puts missing.empty? ? "ok" : missing.join(",")
RUBY
}

run_auth() {
  mkdir -p "$CONFIG_DIR"
  local missing="needed"
  if [[ -f "$TOKEN_PATH" && "$FORCE_REAUTH" -eq 0 ]]; then
    missing="$(token_missing_scopes "$TOKEN_PATH" "$SCOPES")"
    if [[ "$missing" == "ok" ]]; then
      info "Token existente con los scopes pedidos — omitiendo login (usá --reauth para forzar)"
      return
    fi
    info "El token no cubre todos los scopes ($missing). Hay que volver a autorizar en el navegador."
    rm -f "$TOKEN_PATH"
  elif [[ "$FORCE_REAUTH" -eq 1 && -f "$TOKEN_PATH" ]]; then
    info "--reauth: borrando token local"
    rm -f "$TOKEN_PATH"
  fi
  info "Abriendo navegador para autorizar Google (apps: $APPS_ARG)..."
  export GDRIVE_MCP_OAUTH_PATH="$OAUTH_PATH"
  export GDRIVE_MCP_TOKEN_PATH="$TOKEN_PATH"
  export GDRIVE_MCP_SCOPES="$SCOPES"
  npx -y @ibarcarty/mcp-server-google-drive auth
  if [[ -f "$TOKEN_PATH" ]]; then
    chmod 600 "$TOKEN_PATH"
    info "Token guardado en $TOKEN_PATH"
  else
    warn "No se encontró token en $TOKEN_PATH — verificá que la autorización completó."
  fi
}

merge_mcp_json_file() {
  local mcp_path="$1"
  mkdir -p "$(dirname "$mcp_path")"
  if ! command -v ruby >/dev/null 2>&1; then
    warn "Ruby no disponible — agregá manualmente a $mcp_path (ver docs/02_guides/drive-cerebro-setup.md)"
    return 1
  fi

  ruby - "$mcp_path" "$MCP_SERVER_NAME" "$OAUTH_PATH" "$TOKEN_PATH" "$SCOPES" <<'RUBY'
require "json"
require "fileutils"

mcp_path, server_name, oauth_path, token_path, scope = ARGV
data = if File.exist?(mcp_path)
  JSON.parse(File.read(mcp_path))
else
  {}
end
data["mcpServers"] ||= {}
data["mcpServers"][server_name] = {
  "command" => "npx",
  "args" => ["-y", "@ibarcarty/mcp-server-google-drive"],
  "env" => {
    "GDRIVE_MCP_OAUTH_PATH" => oauth_path,
    "GDRIVE_MCP_TOKEN_PATH" => token_path,
    "GDRIVE_MCP_SCOPES" => scope
  }
}
FileUtils.mkdir_p(File.dirname(mcp_path))
File.write(mcp_path, JSON.pretty_generate(data) + "\n")
puts "→ MCP configurado en #{mcp_path} (#{server_name})"
RUBY
}

antigravity_mcp_paths() {
  local paths=()
  [[ -d "$HOME/.gemini/config" || -f "$HOME/.gemini/config/mcp_config.json" ]] && paths+=("$HOME/.gemini/config/mcp_config.json")
  [[ -d "$HOME/.gemini/antigravity" || -f "$HOME/.gemini/antigravity/mcp_config.json" ]] && paths+=("$HOME/.gemini/antigravity/mcp_config.json")
  if [[ ${#paths[@]} -eq 0 ]]; then
    paths+=("$HOME/.gemini/config/mcp_config.json")
  fi
  printf '%s\n' "${paths[@]}" | awk '!seen[$0]++'
}

configure_ide_mcp() {
  case "$IDE_TARGET" in
    cursor|all)
      merge_mcp_json_file "${CURSOR_MCP_JSON:-$HOME/.cursor/mcp.json}"
      ;;
  esac
  case "$IDE_TARGET" in
    antigravity|all)
      local path
      while IFS= read -r path; do
        [[ -n "$path" ]] || continue
        merge_mcp_json_file "$path" || true
      done < <(antigravity_mcp_paths)
      ;;
  esac
}

print_next_steps() {
  cat <<EOF

Listo. Próximos pasos:
  1. Reiniciá tu IDE (Cursor y/o Antigravity).
  2. Verificá MCP: google-drive-dt activo.
  3. En el chat: /yo → /drive, /gmail o /calendar (selector de esa app).
  4. Guía: docs/02_guides/drive-cerebro-setup.md · spec: vitals/specs/google-apps-mcp.md

EOF
}

main() {
  parse_args "$@"
  info "El DT — setup Google MCP (apps: $APPS_ARG; IDE: $IDE_TARGET)"
  require_node
  local creds
  creds="$(resolve_credentials_path)"
  if [[ "$creds" != "$OAUTH_PATH" ]]; then
    install_credentials "$creds"
  fi
  run_auth
  configure_ide_mcp
  print_next_steps
}

main "$@"
