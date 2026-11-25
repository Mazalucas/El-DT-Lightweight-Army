#!/usr/bin/env bash
# dt-install — toolchain de El DT en macOS.
# Idempotente. Si un camino falla, prueba el siguiente y sigue con el resto.
#
# Base (sin flags): git, Ruby, GitHub CLI, Node.js LTS, Python 3.
#   Por herramienta: lo que ya esté en PATH → Homebrew → descarga directa.
#   git sin Homebrew: Command Line Tools de Apple (xcode-select).
# Opcional, no entra en el perfil base:
#   --atelier   npm ci en tools/atelier (impeccable)
#   --video     ffmpeg y npm ci en tools/remotion
#   --full      --atelier y --video
#   --check     no instala; exit 1 si falta algo de lo pedido
#
# Windows: powershell -ExecutionPolicy Bypass -File .\scripts\dt-install.ps1
set -uo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)/.."
ROOT="$(cd "$ROOT" && pwd)"
LIST="$(cd "$(dirname "$0")" && pwd)/dt-toolchain.list"
PREFIX="${HOME}/.local/el-dt"
BIN="${PREFIX}/bin"
CACHE="${PREFIX}/cache"
NODE_LTS_MAJOR="22"
WITH_ATELIER=0
WITH_VIDEO=0
CHECK_ONLY=0
MISSING=0
BREW_TRIED=0

for arg in "$@"; do
  case "$arg" in
    --full) WITH_ATELIER=1; WITH_VIDEO=1 ;;
    --atelier) WITH_ATELIER=1 ;;
    --video) WITH_VIDEO=1 ;;
    --check) CHECK_ONLY=1 ;;
    -h|--help)
      cat <<'EOF'
Uso: ./scripts/dt-install.sh [--atelier] [--video] [--full] [--check]

Perfil base (siempre):
  git, Ruby, GitHub CLI, Node.js LTS, Python 3
  Cada uno prueba, en orden: comando ya usable, Homebrew, descarga directa.
  git, si no hay Homebrew: Command Line Tools (xcode-select --install).

Opcional (no es el perfil base):
  --atelier   npm ci en tools/atelier (impeccable)
  --video     ffmpeg y npm ci en tools/remotion
  --full      las dos anteriores
  --check     no descarga ni instala; exit 1 si falta algo pedido

Lo que ya responde no se reinstala. Si un paso falla, el script sigue
con el camino siguiente y con la herramienta siguiente.
Las descargas directas quedan en ~/.local/el-dt y se agregan al PATH.

En Windows: powershell -ExecutionPolicy Bypass -File .\scripts\dt-install.ps1
EOF
      exit 0
      ;;
    *)
      echo "dt-install: flag desconocida: $arg" >&2
      exit 2
      ;;
  esac
done

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "dt-install: este script es para macOS." >&2
  echo "En Windows: powershell -ExecutionPolicy Bypass -File .\\scripts\\dt-install.ps1" >&2
  exit 2
fi

if [[ ! -f "$LIST" ]]; then
  echo "dt-install: no está $LIST" >&2
  exit 1
fi

case "$(uname -m)" in
  arm64) ARCH="arm64" ;;
  x86_64) ARCH="x64" ;;
  *)
    echo "dt-install: arquitectura no soportada: $(uname -m)" >&2
    exit 2
    ;;
esac

note() { printf '→ %s\n' "$1"; }
ok() { printf '✓ %s\n' "$1"; }
miss() { printf '✗ falta %s\n' "$1"; MISSING=1; }
step_failed() { printf '  (falló: %s — sigo con el camino siguiente)\n' "$1"; }

shell_rc() {
  case "${SHELL:-}" in
    *bash) printf '%s\n' "${HOME}/.bash_profile" ;;
    *) printf '%s\n' "${HOME}/.zprofile" ;;
  esac
}

persist_path() {
  local dir="$1" rc
  [[ -n "$dir" && -d "$dir" ]] || return 0
  case "$dir" in
    /usr/bin|/bin) return 0 ;;
  esac
  case ":${PATH}:" in
    *":${dir}:"*) ;;
    *) export PATH="${dir}:${PATH}" ;;
  esac
  [[ "$CHECK_ONLY" -eq 1 ]] && return 0
  rc="$(shell_rc)"
  touch "$rc"
  if grep -qF "${dir}" "$rc"; then
    return 0
  fi
  printf '\n# El DT toolchain (scripts/dt-install.sh)\nexport PATH="%s:$PATH"\n' "$dir" >>"$rc"
  note "PATH actualizado en ${rc} (${dir}). Una terminal nueva lo hereda."
}

list_field() {
  local id="$1" col="$2"
  awk -F'|' -v id="$id" -v col="$col" '
    $0 ~ /^[[:space:]]*#/ { next }
    $2 == id { print $col; exit }
  ' "$LIST"
}

download() {
  local url="$1" dest="$2"
  mkdir -p "$(dirname "$dest")"
  curl -fL --retry 3 --retry-delay 2 -A "ElDT-toolchain" -o "$dest" "$url"
}

github_asset_url() {
  local repo="$1" regex="$2" page="${3:-latest}"
  local json url endpoint
  if [[ "$page" == "latest" ]]; then
    endpoint="https://api.github.com/repos/${repo}/releases/latest"
  elif [[ "$page" == "scan" ]]; then
    endpoint="https://api.github.com/repos/${repo}/releases?per_page=100"
  else
    endpoint="https://api.github.com/repos/${repo}/releases?per_page=8"
  fi
  json="$(curl -fsSL -A "ElDT-toolchain" -H "Accept: application/vnd.github+json" "$endpoint" || true)"
  [[ -n "$json" ]] || return 1
  url="$(printf '%s\n' "$json" | grep -oE "https://[^\"]+${regex}" | head -n 1 || true)"
  [[ -n "$url" ]] || return 1
  printf '%s\n' "$url"
}

load_brew() {
  if command -v brew >/dev/null 2>&1; then
    return 0
  fi
  if [[ -x /opt/homebrew/bin/brew ]]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
    return 0
  fi
  if [[ -x /usr/local/bin/brew ]]; then
    eval "$(/usr/local/bin/brew shellenv)"
    return 0
  fi
  return 1
}

ensure_brew() {
  if load_brew; then
    return 0
  fi
  [[ "$CHECK_ONLY" -eq 1 ]] && return 1
  if [[ "$BREW_TRIED" -eq 1 ]]; then
    return 1
  fi
  BREW_TRIED=1
  note "Homebrew no está. Lo intento una vez (puede pedir la contraseña). Si no entra, sigo sin él."
  if ! NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"; then
    step_failed "instalador de Homebrew"
    return 1
  fi
  if load_brew; then
    ok "Homebrew"
    return 0
  fi
  step_failed "Homebrew no quedó en PATH"
  return 1
}

brew_formula() {
  local formula="$1"
  [[ -n "$formula" ]] || return 1
  ensure_brew || return 1
  note "Homebrew: brew install ${formula}"
  if ! brew install "$formula"; then
    step_failed "brew install ${formula}"
    return 1
  fi
  return 0
}

git_ok() {
  local g
  if [[ -x /opt/homebrew/bin/git ]]; then
    /opt/homebrew/bin/git --version >/dev/null 2>&1 && return 0
  fi
  if [[ -x /usr/local/bin/git ]]; then
    /usr/local/bin/git --version >/dev/null 2>&1 && return 0
  fi
  if [[ -x /Library/Developer/CommandLineTools/usr/bin/git ]]; then
    /Library/Developer/CommandLineTools/usr/bin/git --version >/dev/null 2>&1 && return 0
  fi
  # Con CLT o Xcode instalados, /usr/bin/git es el de Apple. Sin eso, es un
  # stub que abre un diálogo: no lo invocamos.
  if xcode-select -p >/dev/null 2>&1 && [[ -x /usr/bin/git ]]; then
    /usr/bin/git --version >/dev/null 2>&1 && return 0
  fi
  g="$(command -v git 2>/dev/null || true)"
  [[ -n "$g" && "$g" != "/usr/bin/git" ]] || return 1
  "$g" --version >/dev/null 2>&1
}

git_bin() {
  if [[ -x /opt/homebrew/bin/git ]]; then printf '%s\n' /opt/homebrew/bin/git; return 0; fi
  if [[ -x /usr/local/bin/git ]]; then printf '%s\n' /usr/local/bin/git; return 0; fi
  if [[ -x /Library/Developer/CommandLineTools/usr/bin/git ]]; then
    printf '%s\n' /Library/Developer/CommandLineTools/usr/bin/git
    return 0
  fi
  if xcode-select -p >/dev/null 2>&1 && [[ -x /usr/bin/git ]]; then
    printf '%s\n' /usr/bin/git
    return 0
  fi
  command -v git
}

activate_git() {
  local g dir
  g="$(git_bin)" || return 1
  dir="$(dirname "$g")"
  persist_path "$dir"
  "$g" --version >/dev/null 2>&1
}

install_git() {
  local formula
  if git_ok && activate_git; then
    local g
    g="$(git_bin)"
    ok "git (${g} — $("$g" --version 2>/dev/null | head -n 1 || true))"
    return 0
  fi
  if [[ "$CHECK_ONLY" -eq 1 ]]; then
    miss "git (caminos: PATH, Homebrew, Command Line Tools)"
    return 0
  fi
  formula="$(list_field git 4)"
  brew_formula "$formula" || true
  if git_ok && activate_git; then
    ok "git (Homebrew)"
    return 0
  fi
  if [[ -x /Library/Developer/CommandLineTools/usr/bin/git ]]; then
    persist_path /Library/Developer/CommandLineTools/usr/bin
    if git_ok; then
      ok "git (Command Line Tools)"
      return 0
    fi
  fi
  if ! xcode-select -p >/dev/null 2>&1; then
    note "git sigue sin estar. Abro el instalador de Command Line Tools de Apple."
    xcode-select --install || true
    miss "git (el diálogo de Command Line Tools quedó abierto; cuando termine, volvé a correr este script)"
    return 0
  fi
  miss "git (Homebrew y Command Line Tools no dejaron un git usable)"
}

ruby_bin_ok() {
  local b="$1"
  [[ -n "$b" && -x "$b" ]] || return 1
  "$b" -ryaml -e 'abort "no" unless defined?(YAML)' >/dev/null 2>&1
}

find_ruby() {
  local b
  for b in \
    "$(command -v ruby 2>/dev/null || true)" \
    /usr/bin/ruby \
    /opt/homebrew/opt/ruby/bin/ruby \
    /usr/local/opt/ruby/bin/ruby \
    "${BIN}/ruby"
  do
    if ruby_bin_ok "$b"; then
      printf '%s\n' "$b"
      return 0
    fi
  done
  return 1
}

install_ruby() {
  local formula b url tar ruby_arch
  if b="$(find_ruby)"; then
    persist_path "$(dirname "$b")"
    ok "ruby ($("$b" -e 'print RUBY_VERSION') — ${b})"
    return 0
  fi
  if [[ "$CHECK_ONLY" -eq 1 ]]; then
    miss "ruby (caminos: Ruby del sistema con YAML, Homebrew, tarball Ruby 3.4)"
    return 0
  fi
  formula="$(list_field ruby 4)"
  brew_formula "$formula" || true
  if b="$(find_ruby)"; then
    persist_path "$(dirname "$b")"
    ok "ruby (Homebrew, $("$b" -e 'print RUBY_VERSION'))"
    return 0
  fi
  case "$ARCH" in
    arm64) ruby_arch="arm64" ;;
    *) ruby_arch="x64" ;;
  esac
  note "Descarga directa de Ruby 3.4 (darwin-${ruby_arch})."
  url="$(github_asset_url "ruby/ruby-builder" "ruby-3\\.4\\.[0-9]+-darwin-${ruby_arch}\\.tar\\.gz" scan || true)"
  if [[ -z "$url" ]]; then
    miss "ruby (el sistema no tiene YAML, Homebrew falló y no encontré el tarball 3.4)"
    return 0
  fi
  tar="${CACHE}/ruby.tar.gz"
  if ! download "$url" "$tar"; then
    step_failed "descarga de ruby"
    miss "ruby"
    return 0
  fi
  rm -rf "${PREFIX}/ruby"
  mkdir -p "${PREFIX}/ruby"
  if ! tar -xzf "$tar" -C "${PREFIX}/ruby"; then
    step_failed "extracción de ruby"
    miss "ruby"
    return 0
  fi
  b="$(find "${PREFIX}/ruby" -type f -path '*/bin/ruby' | head -n 1 || true)"
  if ! ruby_bin_ok "$b"; then
    miss "ruby (el tarball no dejó un ruby con YAML)"
    return 0
  fi
  persist_path "$(dirname "$b")"
  ok "ruby (tarball $("$b" -e 'print RUBY_VERSION') — ${b})"
}

install_gh() {
  local formula url zip inner gh_arch
  if command -v gh >/dev/null 2>&1 && gh --version >/dev/null 2>&1; then
    ok "gh ($(gh --version 2>/dev/null | head -n 1 || true))"
    return 0
  fi
  if [[ "$CHECK_ONLY" -eq 1 ]]; then
    miss "gh (caminos: PATH, Homebrew, zip oficial de cli/cli)"
    return 0
  fi
  formula="$(list_field gh 4)"
  brew_formula "$formula" || true
  if command -v gh >/dev/null 2>&1 && gh --version >/dev/null 2>&1; then
    ok "gh (Homebrew)"
    return 0
  fi
  case "$ARCH" in
    arm64) gh_arch="arm64" ;;
    *) gh_arch="amd64" ;;
  esac
  note "Descarga directa de GitHub CLI (macOS ${gh_arch})."
  url="$(github_asset_url "cli/cli" "macOS_${gh_arch}\\.zip" latest || true)"
  if [[ -z "$url" ]]; then
    miss "gh (Homebrew falló y la API de GitHub no devolvió el zip)"
    return 0
  fi
  zip="${CACHE}/gh.zip"
  if ! download "$url" "$zip"; then
    step_failed "descarga de gh"
    miss "gh"
    return 0
  fi
  rm -rf "${CACHE}/gh-extract"
  mkdir -p "${CACHE}/gh-extract"
  if ! unzip -q -o "$zip" -d "${CACHE}/gh-extract"; then
    step_failed "unzip de gh"
    miss "gh"
    return 0
  fi
  inner="$(find "${CACHE}/gh-extract" -type f -path '*/bin/gh' | head -n 1 || true)"
  if [[ -z "$inner" ]]; then
    miss "gh (el zip no trae bin/gh)"
    return 0
  fi
  mkdir -p "$BIN"
  cp "$inner" "${BIN}/gh"
  chmod +x "${BIN}/gh"
  persist_path "$BIN"
  if command -v gh >/dev/null 2>&1; then
    ok "gh (zip en ${BIN}/gh)"
  else
    miss "gh"
  fi
}

install_node() {
  local formula sums name url tar
  if command -v node >/dev/null 2>&1 && node --version >/dev/null 2>&1; then
    ok "node ($(node --version 2>/dev/null || true))"
    return 0
  fi
  if [[ "$CHECK_ONLY" -eq 1 ]]; then
    miss "node (caminos: PATH, Homebrew, tarball LTS ${NODE_LTS_MAJOR} de nodejs.org)"
    return 0
  fi
  formula="$(list_field node 4)"
  brew_formula "$formula" || true
  if command -v node >/dev/null 2>&1 && node --version >/dev/null 2>&1; then
    ok "node (Homebrew)"
    return 0
  fi
  note "Descarga directa de Node.js LTS ${NODE_LTS_MAJOR}."
  sums="$(curl -fsSL -A "ElDT-toolchain" "https://nodejs.org/dist/latest-v${NODE_LTS_MAJOR}.x/SHASUMS256.txt" || true)"
  name="$(printf '%s\n' "$sums" | awk -v arch="$ARCH" '$2 ~ ("node-v.*-darwin-" arch ".tar.gz$") { gsub(/^\.\//, "", $2); print $2; exit }')"
  if [[ -z "$name" ]]; then
    miss "node (Homebrew falló y nodejs.org no publicó el tarball darwin-${ARCH})"
    return 0
  fi
  url="https://nodejs.org/dist/latest-v${NODE_LTS_MAJOR}.x/${name}"
  tar="${CACHE}/${name}"
  if ! download "$url" "$tar"; then
    step_failed "descarga de node"
    miss "node"
    return 0
  fi
  rm -rf "${PREFIX}/node"
  mkdir -p "${PREFIX}/node"
  if ! tar -xzf "$tar" -C "${PREFIX}/node" --strip-components=1; then
    step_failed "extracción de node"
    miss "node"
    return 0
  fi
  mkdir -p "$BIN"
  ln -sfn "${PREFIX}/node/bin/node" "${BIN}/node"
  ln -sfn "${PREFIX}/node/bin/npm" "${BIN}/npm"
  ln -sfn "${PREFIX}/node/bin/npx" "${BIN}/npx"
  persist_path "$BIN"
  if command -v node >/dev/null 2>&1; then
    ok "node (tarball en ${PREFIX}/node)"
  else
    miss "node"
  fi
}

python3_ok() {
  command -v python3 >/dev/null 2>&1 && python3 --version >/dev/null 2>&1
}

install_python() {
  local formula url tar py_arch
  if python3_ok; then
    ok "python3 ($(python3 --version 2>/dev/null || true))"
    return 0
  fi
  if command -v python >/dev/null 2>&1 && python -c 'import sys; raise SystemExit(0 if sys.version_info[0] == 3 else 1)' >/dev/null 2>&1; then
    if [[ "$CHECK_ONLY" -eq 1 ]]; then
      ok "python3 (habría un enlace a $(command -v python))"
      return 0
    fi
    mkdir -p "$BIN"
    ln -sfn "$(command -v python)" "${BIN}/python3"
    persist_path "$BIN"
    if python3_ok; then
      ok "python3 (enlace a $(command -v python))"
      return 0
    fi
  fi
  if [[ "$CHECK_ONLY" -eq 1 ]]; then
    miss "python3 (caminos: PATH, Homebrew, tarball oficial de Python 3.12)"
    return 0
  fi
  formula="$(list_field python 4)"
  brew_formula "$formula" || true
  if python3_ok; then
    ok "python3 (Homebrew)"
    return 0
  fi
  case "$ARCH" in
    arm64) py_arch="aarch64-apple-darwin" ;;
    *) py_arch="x86_64-apple-darwin" ;;
  esac
  note "Descarga directa de Python 3.12 (${py_arch})."
  url="$(github_asset_url "astral-sh/python-build-standalone" "cpython-3\\.12\\.[0-9]+(%2B|\\+)[0-9]+-${py_arch}-install_only\\.tar\\.gz" latest || true)"
  if [[ -z "$url" ]]; then
    miss "python3 (Homebrew falló y no encontré el tarball 3.12)"
    return 0
  fi
  tar="${CACHE}/python.tar.gz"
  if ! download "$url" "$tar"; then
    step_failed "descarga de python"
    miss "python3"
    return 0
  fi
  rm -rf "${PREFIX}/python"
  mkdir -p "$PREFIX"
  if ! tar -xzf "$tar" -C "$PREFIX"; then
    step_failed "extracción de python"
    miss "python3"
    return 0
  fi
  if [[ ! -x "${PREFIX}/python/bin/python3" ]]; then
    miss "python3 (el tarball no trae python/bin/python3)"
    return 0
  fi
  mkdir -p "$BIN"
  ln -sfn "${PREFIX}/python/bin/python3" "${BIN}/python3"
  persist_path "$BIN"
  if python3_ok; then
    ok "python3 (tarball en ${PREFIX}/python)"
  else
    miss "python3"
  fi
}

install_ffmpeg() {
  local formula url zip
  [[ "$WITH_VIDEO" -eq 1 ]] || return 0
  if command -v ffmpeg >/dev/null 2>&1 && ffmpeg -version >/dev/null 2>&1; then
    ok "ffmpeg"
    return 0
  fi
  if [[ "$CHECK_ONLY" -eq 1 ]]; then
    miss "ffmpeg (caminos: PATH, Homebrew, zip de evermeet.cx)"
    return 0
  fi
  formula="$(list_field ffmpeg 4)"
  brew_formula "$formula" || true
  if command -v ffmpeg >/dev/null 2>&1; then
    ok "ffmpeg (Homebrew)"
    return 0
  fi
  note "Descarga directa de ffmpeg."
  url="https://evermeet.cx/ffmpeg/getrelease/zip"
  zip="${CACHE}/ffmpeg.zip"
  if ! download "$url" "$zip"; then
    step_failed "descarga de ffmpeg"
    miss "ffmpeg"
    return 0
  fi
  rm -rf "${CACHE}/ffmpeg-extract"
  mkdir -p "${CACHE}/ffmpeg-extract"
  if ! unzip -q -o "$zip" -d "${CACHE}/ffmpeg-extract"; then
    step_failed "unzip de ffmpeg"
    miss "ffmpeg"
    return 0
  fi
  if [[ ! -f "${CACHE}/ffmpeg-extract/ffmpeg" ]]; then
    miss "ffmpeg (el zip no trae el binario ffmpeg)"
    return 0
  fi
  mkdir -p "$BIN"
  cp "${CACHE}/ffmpeg-extract/ffmpeg" "${BIN}/ffmpeg"
  chmod +x "${BIN}/ffmpeg"
  persist_path "$BIN"
  if command -v ffmpeg >/dev/null 2>&1; then
    ok "ffmpeg (zip en ${BIN}/ffmpeg)"
  else
    miss "ffmpeg"
  fi
}

npm_ci() {
  local dir="$1" label="$2" sentinel="$3"
  if [[ -x "${ROOT}/${sentinel}" ]]; then
    ok "$label"
    return 0
  fi
  if ! command -v npm >/dev/null 2>&1; then
    miss "${label} (npm no está; el perfil base no alcanzó a dejar Node)"
    return 0
  fi
  if [[ "$CHECK_ONLY" -eq 1 ]]; then
    miss "${label} (npm ci en ${dir})"
    return 0
  fi
  note "npm ci en ${dir}"
  if ! (cd "${ROOT}/${dir}" && npm ci); then
    miss "$label"
    return 0
  fi
  if [[ -x "${ROOT}/${sentinel}" ]]; then
    ok "$label"
  else
    miss "$label"
  fi
}

install_git
install_ruby
install_gh
install_node
install_python
install_ffmpeg

if [[ "$WITH_ATELIER" -eq 1 ]]; then
  npm_ci "tools/atelier" "atelier (impeccable)" "tools/atelier/node_modules/.bin/impeccable"
fi
if [[ "$WITH_VIDEO" -eq 1 ]]; then
  npm_ci "tools/remotion" "remotion" "tools/remotion/node_modules/.bin/remotion"
fi

if command -v gh >/dev/null 2>&1; then
  if gh auth status >/dev/null 2>&1; then
    ok "gh autenticado"
  else
    note "GitHub CLI está instalado y todavía no tiene sesión. Cuando quieras publicar: gh auth login"
  fi
fi

if [[ "$MISSING" -ne 0 ]]; then
  echo "dt-install: quedó algo pendiente. Volvé a correr el mismo comando: lo que ya responde no se reinstala." >&2
  exit 1
fi

echo "dt-install: listo."
