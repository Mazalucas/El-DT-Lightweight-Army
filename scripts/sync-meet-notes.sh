#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/modules/meet-notes-sync"
if [[ ! -d node_modules ]]; then npm install; fi
exec npm run sync -- "$@"
