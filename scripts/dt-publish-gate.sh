#!/usr/bin/env bash
# Gate de /guardar: ¿este checkout puede publicar, y a qué remoto?
# Exit distinto de cero es una decisión, no un fallo técnico. Leé DT_PUBLISH_GATE.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=lib/force_utf8.sh
. "$(dirname "$(realpath "${BASH_SOURCE[0]}")")/lib/force_utf8.sh"
exec ruby "$ROOT/scripts/dt-canonical-publish.rb" gate
