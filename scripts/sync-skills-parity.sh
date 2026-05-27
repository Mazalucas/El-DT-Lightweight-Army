#!/usr/bin/env bash
# Copia skills de .cursor/skills/ → .agent/skills/ (mismo nombre de carpeta)
# Uso: ./scripts/sync-skills-parity.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/.cursor/skills"
DST="$ROOT/.agent/skills"

if [[ ! -d "$SRC" ]]; then
  echo "sync-skills-parity: no existe $SRC" >&2
  exit 1
fi

mkdir -p "$DST"
count=0
for dir in "$SRC"/*/; do
  [[ -d "$dir" ]] || continue
  name="$(basename "$dir")"
  skill="$dir/SKILL.md"
  [[ -f "$skill" ]] || continue
  mkdir -p "$DST/$name"
  cp "$skill" "$DST/$name/SKILL.md"
  echo "Copied $name"
  count=$((count + 1))
done

echo "sync-skills-parity: $count skill(s) → .agent/skills/"
