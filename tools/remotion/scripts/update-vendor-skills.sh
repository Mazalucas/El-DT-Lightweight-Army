#!/usr/bin/env bash
# Update remotion-dev/skills vendor package into .cursor/skills/remotion-best-practices/
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$ROOT"

echo "Updating remotion-dev/skills..."
npx skills add remotion-dev/skills --yes

echo "Run ./scripts/sync-ide.sh to mirror to other IDEs."
