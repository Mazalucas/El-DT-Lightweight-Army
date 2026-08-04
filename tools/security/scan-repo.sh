#!/usr/bin/env bash
# scan-repo.sh — evidencia determinista para el subagente hack-audit (/hack).
#
# Read-only y sin red: no instala, no llama APIs, no escribe en el repo.
# Nunca imprime el valor de un secreto — solo `path:línea` y el tipo de patrón.
#
# Uso:
#   ./tools/security/scan-repo.sh [--history] [--full] [ruta]
#     --history   busca además patrones de secreto en el historial Git (más lento)
#     --full      sin tope por tipo (por defecto muestra 12 y cuenta el resto)
#
# Salida: líneas estables `[TIPO] path:línea — nota`, agrupadas por dominio.
# Exit:   0 sin señales · 1 señales encontradas · 2 error de uso
#
# Las señales son PISTAS, no hallazgos: la skill exige trazar origen→sink y
# descartar controles antes de afirmar una vulnerabilidad (severity-rubric.md).

set -uo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SCAN_HISTORY=0
MAX_PER_TYPE=12
TARGET="$ROOT"

while [ $# -gt 0 ]; do
  case "$1" in
    --history) SCAN_HISTORY=1 ;;
    --full) MAX_PER_TYPE=0 ;;
    -h | --help)
      sed -n '2,16p' "$0"
      exit 0
      ;;
    -*)
      echo "scan-repo: opción desconocida $1" >&2
      exit 2
      ;;
    *) TARGET="$1" ;;
  esac
  shift
done

[ -d "$TARGET" ] || {
  echo "scan-repo: ruta inexistente: $TARGET" >&2
  exit 2
}

FINDINGS=0

# Dependencias y artefactos de build.
EXCLUDES=(
  node_modules .git dist build .next out coverage
  .venv venv __pycache__ vendor
)

# Rutas que inflarían el ruido sin aportar señal sobre el código propio:
#  - espejos generados por sync-ide (.claude/, .agents/) — misma fuente, triple match
#  - código vendoreado de terceros (tools/atelier) — se audita upstream, no acá
#  - la propia documentación de hack-audit, que contiene los patrones buscados
PATH_EXCLUDES=(
  ".claude/**"
  ".agents/**"
  "tools/atelier/**"
  "**/skills/hack-audit/**"
  "**/hack-audit-default.md"
  "tools/security/**"
  "vitals/work/audits/**"
)
# Equivalente para el fallback grep (regex de exclusión sobre el path).
GREP_EXCLUDE_RE='^(\.claude/|\.agents/|tools/atelier/|tools/security/|vitals/work/audits/)|skills/hack-audit/|hack-audit-default\.md'

# Extensiones de código: los patrones de sink solo tienen sentido acá. Un README
# que muestra `eval()` como ejemplo no es una vulnerabilidad.
CODE_GLOBS=(
  '*.js' '*.jsx' '*.mjs' '*.cjs' '*.ts' '*.tsx' '*.vue' '*.svelte'
  '*.py' '*.rb' '*.go' '*.php' '*.java' '*.cs' '*.html' '*.astro'
)

have_rg() { command -v rg >/dev/null 2>&1; }

# search_raw PATRÓN [solo_código]
search_raw() {
  local pattern="$1" code_only="${2:-0}"
  if have_rg; then
    # --hidden es obligatorio: sin él rg no entra a .github/workflows, .env* ni
    # .cursor/** — justo la superficie de CI, secretos y agentes que hay que auditar.
    local args=(--no-heading -n -i --hidden -e "$pattern")
    local dir glob
    for dir in "${EXCLUDES[@]}"; do args+=(-g "!$dir"); done
    for glob in "${PATH_EXCLUDES[@]}"; do args+=(-g "!$glob"); done
    if [ "$code_only" = "1" ]; then
      for glob in "${CODE_GLOBS[@]}"; do args+=(-g "$glob"); done
    fi
    (cd "$TARGET" && rg "${args[@]}" . 2>/dev/null | sed 's|^\./||')
  else
    local args=(-rnIE -i)
    local dir glob
    for dir in "${EXCLUDES[@]}"; do args+=(--exclude-dir="$dir"); done
    if [ "$code_only" = "1" ]; then
      for glob in "${CODE_GLOBS[@]}"; do args+=(--include="$glob"); done
    fi
    (cd "$TARGET" && grep "${args[@]}" -e "$pattern" . 2>/dev/null |
      sed 's|^\./||' | grep -Ev "$GREP_EXCLUDE_RE")
  fi
}

# Emite path:línea sin el contenido (podría ser el secreto).
scan_quiet() {
  emit "$1" "$(search_raw "$2" | cut -d: -f1,2 | sort -u)" "${3:-}"
}

# Emite path:línea + fragmento, para señales que no son sensibles.
scan_visible() {
  emit "$1" "$(search_raw "$2" | cut -c1-180 | sort -u)" "${3:-}"
}

# Igual que scan_visible pero restringido a archivos de código.
scan_code() {
  emit "$1" "$(search_raw "$2" 1 | cut -c1-180 | sort -u)" "${3:-}"
}

emit() {
  local type="$1" out="$2" note="$3" total=0 shown=0
  [ -n "$out" ] || return 0
  total="$(printf '%s\n' "$out" | grep -c . || true)"
  while IFS= read -r line; do
    [ -n "$line" ] || continue
    if [ "$MAX_PER_TYPE" -gt 0 ] && [ "$shown" -ge "$MAX_PER_TYPE" ]; then
      printf '[%s] … %s coincidencias más (usar --full)\n' "$type" "$((total - shown))"
      break
    fi
    printf '[%s] %s%s\n' "$type" "$line" "${note:+ — $note}"
    shown=$((shown + 1))
  done <<<"$out"
  FINDINGS=$((FINDINGS + total))
}

section() { printf '\n== %s ==\n' "$1"; }

# ---------------------------------------------------------------- secretos
section "Secretos (valores redactados: solo path:línea)"

scan_quiet "SECRET-AWS" 'AKIA[0-9A-Z]{16}' "posible access key AWS"
scan_quiet "SECRET-GCP" 'AIza[0-9A-Za-z_-]{35}' "posible API key Google"
scan_quiet "SECRET-GITHUB" '(ghp|gho|ghs|github_pat)_[0-9A-Za-z_]{20,}' "posible token GitHub"
scan_quiet "SECRET-SLACK" 'xox[baprs]-[0-9A-Za-z-]{10,}' "posible token Slack"
scan_quiet "SECRET-STRIPE" 'sk_live_[0-9A-Za-z]{16,}' "clave Stripe de producción"
scan_quiet "SECRET-PRIVKEY" 'BEGIN [A-Z ]*PRIVATE KEY' "clave privada embebida"
scan_quiet "SECRET-GENERIC" \
  '(api[_-]?key|client[_-]?secret|password|auth[_-]?token)["'"'"' ]*[:=]+ *["'"'"'][^"'"'"']{20,}["'"'"']' \
  "asignación literal de credencial"

tracked_env="$(git -C "$ROOT" ls-files 2>/dev/null |
  grep -E '(^|/)\.env($|\.)' | grep -Ev '\.(example|template|sample)$' || true)"
if [ -n "$tracked_env" ]; then
  while IFS= read -r f; do
    [ -n "$f" ] || continue
    printf '[SECRET-ENV-TRACKED] %s — archivo de entorno versionado en Git\n' "$f"
    FINDINGS=$((FINDINGS + 1))
  done <<<"$tracked_env"
fi

# ------------------------------------------------------- exposición cliente
section "Exposición al cliente"

scan_visible "CLIENT-SECRET" \
  '(NEXT_PUBLIC|VITE|REACT_APP|PUBLIC)_[A-Z0-9_]*(SECRET|PRIVATE|PASSWORD|SERVICE_ACCOUNT)' \
  "variable pública con nombre de secreto de servidor"
scan_code "CLIENT-SOURCEMAP" \
  '(productionBrowserSourceMaps|sourceMap) *[:=] *true' \
  "source maps potencialmente publicados"

# -------------------------------------------------------------- authz/rules
section "Reglas de acceso (Firebase / similares)"

scan_visible "RULES-OPEN" 'allow +[a-z, ]*: *if +true' "regla abierta a cualquiera"
scan_visible "RULES-AUTH-ONLY" \
  'allow +[a-z, ]*: *if +request\.auth *!= *null' \
  "valida autenticación, no pertenencia — verificar ownership/tenant"

# ------------------------------------------------------------------ sinks
section "Sinks peligrosos (solo código; requieren traza de origen)"

scan_code "SINK-HTML" 'dangerouslySetInnerHTML|\.innerHTML *=|v-html' "escritura de HTML sin escape"
scan_code "SINK-EVAL" '\beval\(|new Function\(' "ejecución dinámica"
scan_code "SINK-SHELL" 'execSync\(|child_process\.exec\(|os\.system\(|subprocess\.(call|run|Popen)\(' \
  "ejecución de comandos — crítico si el argumento se interpola"
scan_code "SINK-CORS" 'Access-Control-Allow-Origin["'"'"': ]*\*' "CORS abierto (crítico con credenciales)"
scan_code "SINK-POSTMSG" 'addEventListener\(["'"'"']message' "listener postMessage — verificar origin"

# ------------------------------------------------------------------- CI/CD
section "CI / CD"

scan_visible "CI-PR-TARGET" 'pull_request_target' "workflow con contexto privilegiado en PRs"
scan_visible "CI-PERMS" 'permissions: *write-all' "permisos amplios en workflow"
scan_visible "CI-INJECTION" '\$\{\{ *github\.event\.[a-z_.]*(body|title|head_ref|name) *\}\}' \
  "input de usuario interpolado en workflow (script injection)"

# ------------------------------------------------- superficie agentes / IA
section "Superficie de agentes / IA (inventario para revisión manual)"

for cfg in mcp.json .mcp.json .cursor/mcp.json .cursor/hooks.json .claude/settings.json; do
  if [ -f "$TARGET/$cfg" ]; then
    printf '[AGENT-CONFIG] %s — inventariar tools, permisos y secretos expuestos al servidor MCP\n' "$cfg"
    FINDINGS=$((FINDINGS + 1))
  fi
done
printf '[AGENT-MANUAL] reglas y skills auto-cargadas — verificar integridad (envenenamiento de instrucciones) y quién puede editarlas\n'

# ---------------------------------------------------------------- historial
if [ "$SCAN_HISTORY" -eq 1 ]; then
  section "Historial Git (commits con patrones de secreto)"
  for pat in 'AKIA[0-9A-Z]{16}' 'AIza[0-9A-Za-z_-]{35}' 'sk_live_[0-9A-Za-z]{16,}' 'BEGIN [A-Z ]*PRIVATE KEY'; do
    commits="$(git -C "$ROOT" log --all --oneline --pickaxe-regex -S"$pat" 2>/dev/null | head -20 || true)"
    [ -n "$commits" ] || continue
    while IFS= read -r c; do
      [ -n "$c" ] || continue
      printf '[HISTORY-SECRET] %s — patrón %s (rotar, no solo borrar)\n' "${c%% *}" "$pat"
      FINDINGS=$((FINDINGS + 1))
    done <<<"$commits"
  done
fi

# ------------------------------------------------------------------ resumen
printf '\n== Resumen ==\n'
printf 'señales=%s  motor=%s  historial=%s  tope_por_tipo=%s\n' \
  "$FINDINGS" "$(have_rg && echo rg || echo grep)" \
  "$([ "$SCAN_HISTORY" -eq 1 ] && echo sí || echo no)" \
  "$([ "$MAX_PER_TYPE" -eq 0 ] && echo sin_tope || echo "$MAX_PER_TYPE")"
printf 'Una señal no es un hallazgo: trazar origen→sink y descartar controles antes de afirmar.\n'

[ "$FINDINGS" -eq 0 ] && exit 0 || exit 1
