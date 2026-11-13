#!/usr/bin/env bash
# Estampa DT-Member desde la sesión local en cualquier commit.
# Lo llama el hook prepare-commit-msg. /guardar también escribe el trailer;
# si ya está, no se duplica.
# En checkout oficial (canonical-checkout.yaml) no estampa: el framework se publica sin operador.
set -euo pipefail

msg_file="${1:-}"
source="${2:-}"

if [[ -z "$msg_file" || ! -f "$msg_file" ]]; then
  exit 0
fi

case "$source" in
  merge|squash) exit 0 ;;
esac

root="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "$root" ]]; then
  exit 0
fi

if [[ -f "$root/vitals/ops/canonical-checkout.yaml" ]]; then
  exit 0
fi

session="$root/vitals/ops/session.yaml"
if [[ ! -f "$session" ]]; then
  exit 0
fi

operator_id="$(
  ruby -ryaml -e '
    data = YAML.load_file(ARGV[0]) || {}
    op = data["operator"]
    id = op.is_a?(Hash) ? op["id"].to_s.strip : ""
    abort if id.empty? || id == "null"
    print id
  ' "$session" 2>/dev/null || true
)"

if [[ -z "$operator_id" ]]; then
  exit 0
fi

if grep -qE '^DT-Member:' "$msg_file"; then
  exit 0
fi

printf '\nDT-Member: %s\n' "$operator_id" >>"$msg_file"
