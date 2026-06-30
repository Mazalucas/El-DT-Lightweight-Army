#!/usr/bin/env bash
# Sync Impeccable upstream into tools/atelier/generated and compose Atelier skill.
set -euo pipefail

ATELIER_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO_ROOT="$(cd "$ATELIER_ROOT/../.." && pwd)"
UPSTREAM="$ATELIER_ROOT/upstream"
LOCK="$ATELIER_ROOT/impeccable-lock.yaml"
GENERATED="$ATELIER_ROOT/generated"

DRY_RUN=false
LATEST=false
TAG=""
CLI_VERSION=""

usage() {
  cat <<EOF
Usage: sync-from-impeccable.sh [options]

  --dry-run          Show planned actions only
  --latest           Use latest GitHub skill release tag
  --tag skill-vX.Y.Z Pin submodule to tag
  --cli VERSION      Pin npm impeccable version (updates package.json)
  -h, --help         This help

Updates impeccable-lock.yaml, generated/, SKILL.md, hooks, skills-lock.json
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY_RUN=true; shift ;;
    --latest) LATEST=true; shift ;;
    --tag) TAG="$2"; shift 2 ;;
    --cli) CLI_VERSION="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; exit 2 ;;
  esac
done

if $LATEST && [[ -z "$TAG" ]]; then
  TAG="$(curl -s "https://api.github.com/repos/pbakaus/impeccable/releases?per_page=10" \
    | python3 -c "import sys,json; rs=json.load(sys.stdin); print(next(r['tag_name'] for r in rs if r['tag_name'].startswith('skill-v')))")"
  echo "Latest skill tag: $TAG"
fi

if [[ -n "$TAG" ]]; then
  echo "Checkout upstream tag: $TAG"
  $DRY_RUN || (cd "$UPSTREAM" && git fetch --tags origin 2>/dev/null || true && git checkout "$TAG")
fi

SUBMODULE_SHA="$(cd "$UPSTREAM" && git rev-parse HEAD)"
SKILL_TAG="${TAG:-$(cd "$UPSTREAM" && git describe --tags --exact-match 2>/dev/null || echo unknown)}"

if [[ -z "$CLI_VERSION" ]] && [[ -f "$LOCK" ]]; then
  CLI_VERSION="$(grep '^cli_version:' "$LOCK" | awk '{print $2}' | tr -d '"')"
fi
if [[ -z "$CLI_VERSION" ]]; then
  CLI_VERSION="$(curl -s https://registry.npmjs.org/impeccable/latest | python3 -c "import sys,json; print(json.load(sys.stdin)['version'])")"
fi

echo "Submodule SHA: $SUBMODULE_SHA"
echo "CLI version: $CLI_VERSION"

if $DRY_RUN; then
  echo "[dry-run] Would copy skill/reference and skill/scripts to generated/"
  echo "[dry-run] Would npm install impeccable@$CLI_VERSION"
  echo "[dry-run] Would run apply-overlays, compose-atelier-skill, merge-hooks"
  exit 0
fi

# Copy upstream skill artifacts
rm -rf "$GENERATED/references" "$GENERATED/scripts"
mkdir -p "$GENERATED/references" "$GENERATED/scripts"

if [[ -d "$UPSTREAM/skill/reference" ]]; then
  cp -R "$UPSTREAM/skill/reference/." "$GENERATED/references/"
fi
if [[ -d "$UPSTREAM/skill/scripts" ]]; then
  cp -R "$UPSTREAM/skill/scripts/." "$GENERATED/scripts/"
fi

REF_COUNT="$(find "$GENERATED/references" -name '*.md' | wc -l | tr -d ' ')"
echo "Copied $REF_COUNT reference files"

# npm CLI pin
node -e "
const fs=require('fs');
const p='$ATELIER_ROOT/package.json';
const j=JSON.parse(fs.readFileSync(p,'utf8'));
j.dependencies=j.dependencies||{};
j.dependencies.impeccable='$CLI_VERSION';
fs.writeFileSync(p, JSON.stringify(j,null,2)+'\n');
"

(cd "$ATELIER_ROOT" && npm install --silent)

node "$ATELIER_ROOT/scripts/apply-overlays.mjs"
node "$ATELIER_ROOT/scripts/compose-atelier-skill.mjs"
node "$ATELIER_ROOT/scripts/merge-hooks.mjs"

# Update lock file
SYNCED_AT="$(date +%Y-%m-%d)"
cat > "$LOCK" <<EOF
# Pin Impeccable upstream for tools/atelier sync.
# Updated by: ./tools/atelier/scripts/sync-from-impeccable.sh
skill_tag: $SKILL_TAG
cli_version: "$CLI_VERSION"
submodule_sha: $SUBMODULE_SHA
synced_at: "$SYNCED_AT"
dt_overlay_version: 1
reference_count_min: 23
reference_count: $REF_COUNT
EOF

# skills-lock.json
SKILLS_LOCK="$REPO_ROOT/skills-lock.json"
node -e "
const fs=require('fs');
const p='$SKILLS_LOCK';
let j={version:1,skills:{}};
if(fs.existsSync(p)) j=JSON.parse(fs.readFileSync(p,'utf8'));
j.skills=j.skills||{};
j.skills['atelier-impeccable']={
  source:'pbakaus/impeccable',
  sourceType:'github-submodule',
  skillTag:'$SKILL_TAG',
  cliVersion:'$CLI_VERSION',
  submoduleSha:'$SUBMODULE_SHA',
  syncedAt:'$SYNCED_AT'
};
fs.writeFileSync(p, JSON.stringify(j,null,2)+'\n');
"

echo "Sync complete. Run: ./scripts/sync-ide.sh && ./scripts/dt-doctor.sh"
