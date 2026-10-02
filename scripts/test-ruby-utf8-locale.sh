#!/usr/bin/env bash
# Regression: Ruby entrypoints must survive LANG=C (Claude Code, CI).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
FAILS=0

assert_no_encoding_error() {
  local label="$1"
  shift
  local out rc
  set +e
  out="$(LANG=C LC_ALL=C "$@" 2>&1)"
  rc=$?
  set -e
  if echo "$out" | grep -qiE 'invalid byte sequence|incompatible character encodings'; then
    echo "FAIL $label: encoding error under LANG=C (exit $rc)" >&2
    echo "$out" >&2
    FAILS=$((FAILS + 1))
    return
  fi
  echo "ok   $label (exit $rc)"
}

assert_exit0() {
  local label="$1"
  shift
  local out rc
  set +e
  out="$(LANG=C LC_ALL=C "$@" 2>&1)"
  rc=$?
  set -e
  if [[ $rc -ne 0 ]] || echo "$out" | grep -qiE 'invalid byte sequence|incompatible character encodings'; then
    echo "FAIL $label: want exit 0 without encoding errors, got $rc" >&2
    echo "$out" >&2
    FAILS=$((FAILS + 1))
    return
  fi
  echo "ok   $label"
}

enc="$(LANG=C LC_ALL=C ruby -e 'load ARGV[0]; print Encoding.default_external.name' "$ROOT/scripts/lib/force_utf8.rb")"
if [[ "$enc" != "UTF-8" ]]; then
  echo "FAIL force_utf8.rb: default_external is $enc" >&2
  FAILS=$((FAILS + 1))
else
  echo "ok   force_utf8.rb sets UTF-8"
fi

assert_exit0 "project-sync-version --dry-run (wrapper)" "$ROOT/scripts/project-sync-version.sh" --dry-run
assert_exit0 "project-resolve-version (wrapper)" "$ROOT/scripts/project-resolve-version.sh" --dry-run
assert_no_encoding_error "dt-doctor.sh --quiet" "$ROOT/scripts/dt-doctor.sh" --quiet
assert_no_encoding_error "ruby dt-doctor.rb --quiet" ruby "$ROOT/scripts/dt-doctor.rb" --quiet
assert_no_encoding_error "sync-ide.sh --check" "$ROOT/scripts/sync-ide.sh" --check
assert_no_encoding_error "ruby sync-ide.rb --check" ruby "$ROOT/scripts/sync-ide.rb" --check
assert_no_encoding_error "ruby sync-catalog.rb --check" ruby "$ROOT/scripts/sync-catalog.rb" --check

if [[ "$FAILS" -gt 0 ]]; then
  echo "FAILED $FAILS" >&2
  exit 1
fi
echo "OK: ruby scripts survive LANG=C"
