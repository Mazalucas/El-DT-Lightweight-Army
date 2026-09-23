#!/usr/bin/env bash
# Gate de /guardar: ¿este checkout puede publicar, y a qué remoto?
# Exit distinto de cero es una decisión, no un fallo técnico. Leé DT_PUBLISH_GATE.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
exec ruby "$ROOT/scripts/dt-canonical-publish.rb" gate
