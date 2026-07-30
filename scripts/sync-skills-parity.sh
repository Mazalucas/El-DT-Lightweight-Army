#!/usr/bin/env bash
# Copia skills de .cursor/skills/ → .agents/skills/ (Antigravity 2.0 + Codex)
# - Raíz: solo SKILL.md (rutinas DT)
# - marketing/*, design/*: árbol completo (SKILL.md + references/ + evals/)
# Uso: ./scripts/sync-skills-parity.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/.cursor/skills"
DST="$ROOT/.agents/skills"

if [[ ! -d "$SRC" ]]; then
  echo "sync-skills-parity: no existe $SRC" >&2
  exit 1
fi

mkdir -p "$DST"
count=0

# Rutinas y skills en la raíz (solo SKILL.md, o árbol completo si hay subcarpetas)
for dir in "$SRC"/*/; do
  [[ -d "$dir" ]] || continue
  name="$(basename "$dir")"
  [[ "$name" == "marketing" || "$name" == "design" ]] && continue
  skill="$dir/SKILL.md"
  [[ -f "$skill" ]] || continue
  if find "$dir" -mindepth 1 -maxdepth 1 ! -name SKILL.md | grep -q .; then
    rm -rf "$DST/$name"
    mkdir -p "$DST/$name"
    cp -R "$dir"/. "$DST/$name/"
    echo "Copied $name/ (full tree)"
  else
    mkdir -p "$DST/$name"
    cp "$skill" "$DST/$name/SKILL.md"
    echo "Copied $name"
  fi
  count=$((count + 1))
done

# Packs tácticos (marketing, design): copiar árbol completo
for pack in marketing design; do
  PACK_SRC="$SRC/$pack"
  PACK_DST="$DST/$pack"
  [[ -d "$PACK_SRC" ]] || continue
  mkdir -p "$PACK_DST"
  pcount=0
  while IFS= read -r -d '' skill; do
    reldir="$(dirname "${skill#$PACK_SRC/}")"
    name="$(basename "$reldir")"
    parent="$(dirname "$reldir")"
    if [[ "$parent" == "." ]]; then
      dest="$PACK_DST/$name"
    else
      dest="$PACK_DST/$reldir"
    fi
    rm -rf "$dest"
    mkdir -p "$dest"
    cp -R "$(dirname "$skill")"/. "$dest/"
    echo "Copied $pack/${reldir#/}/"
    pcount=$((pcount + 1))
  done < <(find "$PACK_SRC" -name SKILL.md -print0)
  echo "sync-skills-parity: $pcount $pack skill(s) → .agents/skills/$pack/"
  if [[ -d "$PACK_SRC/templates" ]]; then
    rm -rf "$PACK_DST/templates"
    cp -R "$PACK_SRC/templates" "$PACK_DST/"
    echo "Copied $pack/templates/"
  fi
done

echo "sync-skills-parity: $count root skill(s) → .agents/skills/"
