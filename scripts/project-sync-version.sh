#!/usr/bin/env bash
# project-sync-version — alinea semver del proyecto desde VERSION (raíz) a sync_paths.
# Uso: ./scripts/project-sync-version.sh [--dry-run]
# Requiere: VERSION en raíz semver; vitals/config/project-version.yaml (opcional sync_paths extra)

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DRY=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY=true; shift ;;
    *) echo "Uso: project-sync-version.sh [--dry-run]" >&2; exit 2 ;;
  esac
done

VERSION_FILE="$ROOT/VERSION"
if [[ ! -f "$VERSION_FILE" ]]; then
  echo "ERROR: falta $VERSION_FILE" >&2
  exit 1
fi

SEMVER="$(tr -d '[:space:]' < "$VERSION_FILE")"
if [[ ! "$SEMVER" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "ERROR: VERSION no semver: '$SEMVER'" >&2
  exit 1
fi

PV="$ROOT/vitals/config/project-version.yaml"
declare -a PATHS=()

if [[ -f "$PV" ]]; then
  while IFS= read -r line; do
    if [[ "$line" =~ path:[[:space:]]*(.+) ]]; then
      p="${BASH_REMATCH[1]}"
      p="${p//\"/}"
      p="${p//\'/}"
      p="$(echo "$p" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
      [[ -n "$p" ]] && PATHS+=("$p")
    fi
  done < "$PV"
fi

# Default mínimo si no hay manifest
if [[ ${#PATHS[@]} -eq 0 ]]; then
  PATHS=("package.json")
fi

updated=0
for rel in "${PATHS[@]}"; do
  f="$ROOT/$rel"
  [[ -f "$f" ]] || continue
  case "$rel" in
    *.json)
      if command -v ruby >/dev/null 2>&1; then
        if $DRY; then
          cur="$(ruby -rjson -e "puts JSON.parse(File.read('$f'))['version'] rescue '?'")"
          echo "would set $rel: $cur -> $SEMVER"
        else
          ruby -rjson -e "
            j = JSON.parse(File.read('$f'))
            j['version'] = '$SEMVER'
            File.write('$f', JSON.pretty_generate(j) + \"\n\")
          "
          echo "updated $rel -> $SEMVER"
        fi
        updated=$((updated + 1))
      else
        echo "WARN: ruby no disponible; omitiendo $rel" >&2
      fi
      ;;
    *)
      echo "skip unsupported sync path: $rel" >&2
      ;;
  esac
done

echo "OK: VERSION=$SEMVER (${updated} path(s) touched)"
