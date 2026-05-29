#!/usr/bin/env bash
# Copia skills de .cursor/skills/ → .agent/skills/
# - Raíz: solo SKILL.md (rutinas DT)
# - marketing/*: árbol completo (SKILL.md + references/ + evals/)
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

# Rutinas y skills de un solo archivo en la raíz
for dir in "$SRC"/*/; do
  [[ -d "$dir" ]] || continue
  name="$(basename "$dir")"
  [[ "$name" == "marketing" ]] && continue
  skill="$dir/SKILL.md"
  [[ -f "$skill" ]] || continue
  mkdir -p "$DST/$name"
  cp "$skill" "$DST/$name/SKILL.md"
  echo "Copied $name"
  count=$((count + 1))
done

# Marketing: copiar cada skill con references/ y evals/
MARKETING_SRC="$SRC/marketing"
MARKETING_DST="$DST/marketing"
if [[ -d "$MARKETING_SRC" ]]; then
  mkdir -p "$MARKETING_DST"
  mcount=0
  for dir in "$MARKETING_SRC"/*/; do
    [[ -d "$dir" ]] || continue
    name="$(basename "$dir")"
    skill="$dir/SKILL.md"
    [[ -f "$skill" ]] || continue
    rm -rf "$MARKETING_DST/$name"
    mkdir -p "$MARKETING_DST/$name"
    cp -R "$dir"/. "$MARKETING_DST/$name/"
    echo "Copied marketing/$name"
    mcount=$((mcount + 1))
  done
  echo "sync-skills-parity: $mcount marketing skill(s) → .agent/skills/marketing/"
fi

echo "sync-skills-parity: $count root skill(s) → .agent/skills/"
