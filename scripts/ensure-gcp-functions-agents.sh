#!/usr/bin/env bash
# Crea service agents de Pub/Sub y Eventarc (requerido 1× por proyecto para Functions gen2).
# Ejecutar con cuenta Owner/Editor del proyecto GCP.
set -euo pipefail

PROJECT="${1:-cerebro-prime-a0729}"

if ! command -v gcloud >/dev/null 2>&1; then
  echo "Instalá Google Cloud SDK: https://cloud.google.com/sdk/docs/install"
  exit 1
fi

echo "Proyecto: $PROJECT"
echo "Cuenta:   $(gcloud config get-value account 2>/dev/null || echo '?')"
echo ""

for svc in pubsub.googleapis.com eventarc.googleapis.com; do
  echo "→ Service identity: $svc"
  gcloud beta services identity create --service="$svc" --project="$PROJECT" --quiet
done

echo "→ Habilitando Compute Engine API (requerida por Cloud Functions gen2)…"
gcloud services enable compute.googleapis.com --project="$PROJECT" --quiet

echo ""
echo "Listo. Reintentá:"
echo "  ./scripts/deploy-cerebro-app.sh --functions --no-bump --skip-build"
