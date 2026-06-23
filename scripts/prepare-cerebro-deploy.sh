#!/usr/bin/env bash
# Valida config de deploy y construye artefactos para cerebro-prime-a0729.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP="$ROOT/modules/cerebro-app"
PROD_ENV="$APP/src/.env.production.local"
PROJECT="cerebro-prime-a0729"
APP_URL="https://${PROJECT}.web.app"

red() { printf '\033[31m%s\033[0m\n' "$*"; }
green() { printf '\033[32m%s\033[0m\n' "$*"; }
yellow() { printf '\033[33m%s\033[0m\n' "$*"; }

echo "══ Cerebro App — preparar deploy ($PROJECT) ══"
echo ""

if [[ ! -f "$APP/.firebaserc" ]]; then
  red "Falta $APP/.firebaserc — copiá .firebaserc.example"
  exit 1
fi

if ! grep -q "\"default\": \"$PROJECT\"" "$APP/.firebaserc"; then
  yellow "Aviso: .firebaserc default no es $PROJECT"
fi

if [[ ! -f "$PROD_ENV" ]]; then
  red "Falta $PROD_ENV"
  echo "  cp $APP/.env.production.local.example $PROD_ENV"
  echo "  # Completar VITE_FIREBASE_API_KEY desde Firebase Console"
  exit 1
fi

if grep -q '^VITE_FIREBASE_API_KEY=$' "$PROD_ENV" 2>/dev/null; then
  red "Completá VITE_FIREBASE_API_KEY en $PROD_ENV"
  exit 1
fi

echo "→ Instalando dependencias…"
npm install --prefix "$APP/src" --silent
npm install --prefix "$APP/functions" --silent

echo "→ Build producción…"
cd "$APP"
npm run build:prod

green "Build OK."
echo ""
echo "Checklist antes de firebase deploy:"
echo ""
echo "  1. Firebase Auth — Google habilitado (ya configurado)"
echo "  2. Google Cloud OAuth Web client (Drive/Docs):"
echo "     - Authorized JS origins: $APP_URL"
echo "     - Redirect URI: ${APP_URL}/api/auth/google/callback"
echo "  3. APIs: Google Drive API + Google Docs API"
echo "  4. Functions env (functions/.env.$PROJECT o Console):"
echo "     - GOOGLE_OAUTH_CLIENT_ID"
echo "     - APP_URL=$APP_URL"
echo "  5. Functions secrets (firebase functions:secrets:set):"
echo "     - GOOGLE_OAUTH_CLIENT_SECRET"
echo "     - ENCRYPTION_KEY"
echo ""
echo "Deploy:"
echo "  cd modules/cerebro-app && firebase deploy"
echo ""
echo "Post-deploy: $APP_URL → login Google → Ajustes → Setup"
