#!/usr/bin/env bash
# Genera rules del IDE desde cuerpos canónicos en vitals/specs/rule-bodies/
# Uso: desde la raíz del repo: ./scripts/sync-dt-from-vitals.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BODY="$ROOT/vitals/specs/rule-bodies"

write_cursor() {
  local stem="$1"
  local desc="$2"
  local out="$ROOT/.cursor/rules/${stem}.mdc"
  local body_file="$BODY/${stem}.body.md"
  if [[ ! -f "$body_file" ]]; then
    echo "Missing body: $body_file" >&2
    exit 1
  fi
  {
    echo "---"
    echo "description: $desc"
    echo "alwaysApply: true"
    echo "---"
    echo ""
    cat "$body_file"
  } > "$out"
  echo "Wrote $out"
}

write_agent() {
  local stem="$1"
  local desc="$2"
  local out="$ROOT/.agent/rules/${stem}.md"
  local body_file="$BODY/${stem}.body.md"
  if [[ ! -f "$body_file" ]]; then
    echo "Missing body: $body_file" >&2
    exit 1
  fi
  {
    echo "---"
    echo "description: $desc"
    echo "---"
    echo ""
    cat "$body_file"
  } > "$out"
  echo "Wrote $out"
}

write_cursor "04-recomendacion-herramientas" "Sugerir al usuario commands, workflows y subagentes pertinentes"
write_agent "04-recomendacion-herramientas" "Sugerir al usuario workflows, skills y comandos pertinentes"

write_cursor "05-multi-project-git" "Resolver a qué proyecto o git_root aplica un pedido en workspaces multi-repo"
write_agent "05-multi-project-git" "Resolver a qué proyecto o git_root aplica un pedido en workspaces multi-repo"

echo "sync-dt-from-vitals: done."
