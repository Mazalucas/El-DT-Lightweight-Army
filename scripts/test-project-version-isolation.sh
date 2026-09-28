#!/usr/bin/env bash
# Isolation tests: the DT semver must never land on a consumer product.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RUBY=(ruby "$ROOT/scripts/project-version.rb")
FAILS=0

assert_eq() {
  local got="$1" want="$2" label="$3"
  if [[ "$got" != "$want" ]]; then
    echo "FAIL $label: got '$got' want '$want'" >&2
    FAILS=$((FAILS + 1))
  else
    echo "ok   $label"
  fi
}

assert_exit() {
  local got="$1" want="$2" label="$3"
  if [[ "$got" != "$want" ]]; then
    echo "FAIL $label: exit $got want $want" >&2
    FAILS=$((FAILS + 1))
  else
    echo "ok   $label"
  fi
}

pkg_ver() {
  ruby -e 'require "json"; puts JSON.parse(File.read(ARGV[0]))["version"]' "$1"
}

assert_file_has() {
  local file="$1" needle="$2" label="$3"
  if grep -q "$needle" "$file"; then
    echo "ok   $label"
  else
    echo "FAIL $label: missing '$needle' in $file" >&2
    FAILS=$((FAILS + 1))
  fi
}

make_consumer() {
  local dir="$1"
  mkdir -p "$dir/vitals/config" "$dir/scripts"
  ln -s "$ROOT/scripts/project-version.rb" "$dir/scripts/project-version.rb"
  ln -s "$ROOT/scripts/project-bump-version.sh" "$dir/scripts/project-bump-version.sh"
  ln -s "$ROOT/scripts/project-sync-version.sh" "$dir/scripts/project-sync-version.sh"
  ln -s "$ROOT/scripts/project-resolve-version.sh" "$dir/scripts/project-resolve-version.sh"
  cat >"$dir/vitals/config/dt-upstream.md" <<'EOF'
---
version: 1
mode: consumer
framework_version: "1.8.0"
---
EOF
  cat >"$dir/vitals/config/project-version.yaml" <<'EOF'
version: 1
initialized: true
auto_bump: classify
initial_semver: "0.1.0"
sync_paths:
  - path: package.json
    type: json
    field: version
  - path: vitals/config/dt-upstream.md
    type: yaml_frontmatter
    field: framework_version
EOF
}

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# --- 1. existing app: VERSION is DT, package.json is the product ---
C1="$TMP/existing-app"
make_consumer "$C1"
echo "1.8.0" >"$C1/VERSION"
printf '%s\n' '{"name":"the-app","version":"0.4.2"}' >"$C1/package.json"

"${RUBY[@]}" resolve --root "$C1" >"$TMP/pv-out.txt"
assert_eq "$(tr -d '[:space:]' <"$C1/VERSION")" "0.4.2" "resolve keeps app 0.4.2"
assert_eq "$(pkg_ver "$C1/package.json")" "0.4.2" "package.json untouched by resolve"
assert_file_has "$TMP/pv-out.txt" "DT_VERSION_ACTION=keep" "action=keep"

NEW="$("$C1/scripts/project-bump-version.sh" patch)"
assert_eq "$NEW" "0.4.3" "bump from app version not DT"
"$C1/scripts/project-sync-version.sh" >"$TMP/pv-sync.txt"
assert_eq "$(pkg_ver "$C1/package.json")" "0.4.3" "sync writes product bump"
FW="$(ruby -e 't=File.read(ARGV[0]); puts t[/framework_version: "?([0-9.]+)/,1]' "$C1/vitals/config/dt-upstream.md")"
assert_eq "$FW" "1.8.0" "sync does not overwrite framework_version"

# --- 2. guard refuses to copy DT onto the app ---
C2="$TMP/guard-dt"
make_consumer "$C2"
echo "1.8.0" >"$C2/VERSION"
printf '%s\n' '{"name":"the-app","version":"0.4.2"}' >"$C2/package.json"
set +e
"${RUBY[@]}" guard --root "$C2" >/dev/null 2>"$TMP/pv-guard.txt"
GEXIT=$?
set -e
assert_exit "$GEXIT" "3" "guard blocks VERSION==framework_version"
assert_file_has "$TMP/pv-guard.txt" "Nunca copies" "guard message forbids copying DT"

set +e
"$C2/scripts/project-bump-version.sh" patch >/dev/null 2>"$TMP/pv-bump.txt"
BEXIT=$?
set -e
assert_exit "$BEXIT" "3" "bump refuses DT VERSION"
assert_eq "$(pkg_ver "$C2/package.json")" "0.4.2" "bump did not rewrite package.json"

set +e
"$C2/scripts/project-sync-version.sh" >/dev/null 2>"$TMP/pv-sync2.txt"
SEXIT=$?
set -e
assert_exit "$SEXIT" "3" "sync refuses DT VERSION"
assert_eq "$(pkg_ver "$C2/package.json")" "0.4.2" "sync did not copy DT onto package.json"

# --- 3. new project: VERSION leftover from DT, no product semver ---
C3="$TMP/new-project"
make_consumer "$C3"
echo "1.8.0" >"$C3/VERSION"
"${RUBY[@]}" resolve --root "$C3" >"$TMP/pv-new.txt"
assert_eq "$(tr -d '[:space:]' <"$C3/VERSION")" "0.1.0" "new project starts at 0.1.0"
assert_file_has "$TMP/pv-new.txt" "DT_VERSION_ACTION=initial" "action=initial"
assert_file_has "$TMP/pv-new.txt" "era la del DT" "message says DT version was discarded"

# --- 4. canonical: VERSION is the DT, bump still works ---
C4="$TMP/canonical"
mkdir -p "$C4/vitals/config" "$C4/scripts"
ln -s "$ROOT/scripts/project-version.rb" "$C4/scripts/project-version.rb"
ln -s "$ROOT/scripts/project-bump-version.sh" "$C4/scripts/project-bump-version.sh"
cat >"$C4/vitals/config/dt-upstream.md" <<'EOF'
---
version: 1
mode: canonical
framework_version: "1.8.0"
---
EOF
echo "1.8.0" >"$C4/VERSION"
"${RUBY[@]}" resolve --root "$C4" >"$TMP/pv-can.txt"
assert_eq "$(tr -d '[:space:]' <"$C4/VERSION")" "1.8.0" "canonical resolve keeps VERSION"
assert_file_has "$TMP/pv-can.txt" "DT_VERSION_ACTION=unchanged" "canonical action=unchanged"
set +e
"${RUBY[@]}" guard --root "$C4" >/dev/null
G4=$?
set -e
assert_exit "$G4" "0" "canonical guard allows VERSION==framework_version"
NEW4="$("$C4/scripts/project-bump-version.sh" patch)"
assert_eq "$NEW4" "1.8.1" "canonical bump from DT VERSION"

# --- 5. conflict: two product versions ---
C5="$TMP/conflict"
make_consumer "$C5"
echo "1.8.0" >"$C5/VERSION"
mkdir -p "$C5/frontend" "$C5/backend"
printf '%s\n' '{"name":"fe","version":"1.0.0"}' >"$C5/frontend/package.json"
printf '%s\n' '{"name":"be","version":"2.0.0"}' >"$C5/backend/package.json"
set +e
"${RUBY[@]}" resolve --root "$C5" >/dev/null 2>"$TMP/pv-conf.txt"
C5EXIT=$?
set -e
assert_exit "$C5EXIT" "2" "resolve errors on conflicting product versions"
assert_eq "$(tr -d '[:space:]' <"$C5/VERSION")" "1.8.0" "conflict does not write VERSION"

if [[ "$FAILS" -ne 0 ]]; then
  echo "FAILED $FAILS assertion(s)" >&2
  exit 1
fi
echo "OK all isolation tests"
