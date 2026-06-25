#!/usr/bin/env bash
# Scaffold Remotion starter into a consumer project path.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
STARTER="$ROOT/tools/remotion/starter"
DEST="${1:-output/remotion-project}"

if [[ ! -d "$STARTER" ]]; then
  echo "Starter not found: $STARTER" >&2
  exit 1
fi

if [[ -e "$DEST" ]]; then
  echo "Destination already exists: $DEST" >&2
  exit 1
fi

mkdir -p "$(dirname "$DEST")"
cp -R "$STARTER" "$DEST"
echo "Scaffolded Remotion project → $DEST"
echo "Next: cd $DEST && npm install && npm run dev"
