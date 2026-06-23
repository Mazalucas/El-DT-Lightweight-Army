#!/usr/bin/env bash
# Deploy Cerebro App → Firebase (cerebro-prime-a0729)
# Uso:
#   ./scripts/deploy-cerebro-app.sh              # build + deploy completo
#   ./scripts/deploy-cerebro-app.sh --hosting    # solo frontend
#   ./scripts/deploy-cerebro-app.sh --functions  # solo Cloud Functions
#   ./scripts/deploy-cerebro-app.sh --rules      # firestore + storage rules
#   ./scripts/deploy-cerebro-app.sh --prepare-only
#   ./scripts/deploy-cerebro-app.sh --skip-build # deploy sin rebuild
#   ./scripts/deploy-cerebro-app.sh --with-storage # incluye storage (requiere Console)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP="$ROOT/modules/cerebro-app"
PROJECT="cerebro-prime-a0729"
APP_URL="https://${PROJECT}.web.app"
TARGET="all"
WITH_STORAGE=false
SKIP_BUILD=false
PREPARE_ONLY=false
NO_BUMP=false

red() { printf '\033[31m%s\033[0m\n' "$*"; }
green() { printf '\033[32m%s\033[0m\n' "$*"; }
yellow() { printf '\033[33m%s\033[0m\n' "$*"; }

STORAGE_CONSOLE="https://console.firebase.google.com/project/${PROJECT}/storage"

check_storage_ready() {
  local out
  if out="$(firebase deploy --only storage --project "$PROJECT" --dry-run 2>&1)"; then
    return 0
  fi
  if grep -q "has not been set up" <<< "$out"; then
    red "Firebase Storage no está activado en $PROJECT."
    echo ""
    echo "  1. Abrí: $STORAGE_CONSOLE"
    echo "  2. Click «Get Started» (modo producción recomendado)"
    echo "  3. Reintentá: ./scripts/deploy-cerebro-app.sh --with-storage"
    echo ""
    echo "  Mientras tanto, deploy sin storage:"
    echo "  ./scripts/deploy-cerebro-app.sh --no-bump --skip-build"
    exit 1
  fi
  red "No se pudo verificar Storage:"
  echo "$out" >&2
  exit 1
}

usage() {
  cat <<EOF
Uso: ./scripts/deploy-cerebro-app.sh [opciones]

Opciones:
  --hosting       Solo Firebase Hosting (frontend)
  --functions     Solo Cloud Functions
  --rules         Solo reglas Firestore (+ storage si --with-storage)
  --with-storage  Incluir Firebase Storage en deploy completo o --rules
  --prepare-only  Validar config y build; no desplegar
  --skip-build    Desplegar sin rebuild (asume artefactos listos)
  --no-bump       No incrementar APP_VERSION (solo redeploy técnico)
  -h, --help      Esta ayuda

Proyecto: $PROJECT
URL:     $APP_URL
Guía:    docs/02_guides/cerebro-app-deploy.md
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --hosting) TARGET="hosting" ;;
    --functions) TARGET="functions" ;;
    --rules) TARGET="rules" ;;
    --with-storage) WITH_STORAGE=true ;;
    --prepare-only) PREPARE_ONLY=true ;;
    --skip-build) SKIP_BUILD=true ;;
    --no-bump) NO_BUMP=true ;;
    -h|--help) usage; exit 0 ;;
    *)
      red "Opción desconocida: $1"
      usage
      exit 1
      ;;
  esac
  shift
done

if ! command -v firebase >/dev/null 2>&1; then
  red "Firebase CLI no encontrado."
  echo "  npm install -g firebase-tools"
  echo "  firebase login"
  exit 1
fi

if [[ ! -f "$APP/.firebaserc" ]]; then
  red "Falta $APP/.firebaserc"
  echo "  cp $APP/.firebaserc.example $APP/.firebaserc"
  exit 1
fi

echo "══ Cerebro App — deploy ($PROJECT) ══"
echo ""

if [[ "$PREPARE_ONLY" == true ]]; then
  exec "$ROOT/scripts/prepare-cerebro-deploy.sh"
fi

if [[ "$WITH_STORAGE" == true ]]; then
  echo "→ Verificando Firebase Storage…"
  (cd "$APP" && check_storage_ready)
  green "Storage OK."
  echo ""
fi

if [[ "$NO_BUMP" != true ]]; then
  echo "→ Incrementando versión (+1)…"
  "$ROOT/scripts/bump-cerebro-app-version.sh"
  echo ""
fi

if [[ "$SKIP_BUILD" != true ]]; then
  "$ROOT/scripts/prepare-cerebro-deploy.sh"
else
  yellow "Saltando build (--skip-build)"
fi

cd "$APP"

echo ""
echo "→ Desplegando ($TARGET)…"
echo ""

case "$TARGET" in
  all)
    if [[ "$WITH_STORAGE" == true ]]; then
      firebase deploy --project "$PROJECT"
    else
      yellow "Storage omitido (activá en Console o usá --with-storage)"
      firebase deploy --project "$PROJECT" --only hosting,functions,firestore:rules,firestore:indexes
    fi
    ;;
  hosting)
    firebase deploy --project "$PROJECT" --only hosting
    ;;
  functions)
    firebase deploy --project "$PROJECT" --only functions
    ;;
  rules)
    if [[ "$WITH_STORAGE" == true ]]; then
      firebase deploy --project "$PROJECT" --only firestore:rules,storage
    else
      firebase deploy --project "$PROJECT" --only firestore:rules
    fi
    ;;
  *)
    red "Target inválido: $TARGET"
    exit 1
    ;;
esac

green "Deploy completado."
echo ""
echo "Post-deploy:"
echo "  1. Abrir $APP_URL → Entrar con Google"
echo "  2. Ajustes → Cerebro Profesional — Setup (wizard)"
echo "  3. Conectar Google, carpetas Meet, API key IA"
echo ""
echo "Docs: docs/02_guides/cerebro-app-deploy.md"
