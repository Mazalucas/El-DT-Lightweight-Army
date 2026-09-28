#!/usr/bin/env bash
# project-sync-version — alinea semver desde VERSION (raíz) a README, YAML, package.json, etc.
# Uso: ./scripts/project-sync-version.sh [--dry-run]
# Manifest: vitals/config/project-version.yaml (sync_paths)
# En consumer no escribe framework_version y aborta si VERSION es la del DT.

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

ruby "$ROOT/scripts/project-version.rb" guard --root "$ROOT" >/dev/null

SEMVER="$(tr -d '[:space:]' < "$VERSION_FILE")"
if [[ ! "$SEMVER" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "ERROR: VERSION no semver: '$SEMVER'" >&2
  exit 1
fi

export ROOT SEMVER DRY
ruby <<'RUBY'
require "json"
require "yaml"

root = ENV.fetch("ROOT")
require File.join(root, "scripts/project-version.rb")

semver = ENV.fetch("SEMVER")
dry = ENV["DRY"] == "true"
upstream = DtProjectVersion.upstream(root)
mode = upstream[:mode]
fw = upstream[:framework_version]
if mode == "consumer" && fw && semver == fw
  warn "ERROR: refuse to sync DT framework_version #{fw} onto product files. Run ./scripts/project-resolve-version.sh"
  exit 3
end
manifest_path = File.join(root, "vitals/config/project-version.yaml")

entries = []
if File.file?(manifest_path)
  data = YAML.load_file(manifest_path) || {}
  entries = Array(data["sync_paths"])
end

# Discover front/back/monorepo si no están en manifest
discover = []
%w[package.json frontend/package.json backend/package.json].each do |rel|
  discover << rel if File.file?(File.join(root, rel))
end
Dir.glob(File.join(root, "apps/*/package.json")).each do |abs|
  discover << abs.sub("#{root}/", "")
end

discover.each do |rel|
  next if entries.any? { |e| e["path"] == rel }
  entries << { "path" => rel, "type" => "json", "field" => "version" }
end

# Defaults si manifest vacío. En consumer nunca se escribe framework_version.
if entries.empty?
  entries = [
    { "path" => "README.md", "type" => "readme_badge" },
    { "path" => "package.json", "type" => "json", "field" => "version" }
  ]
  if mode != "consumer"
    entries.insert(1, { "path" => "vitals/config/dt-upstream.md", "type" => "yaml_frontmatter", "field" => "framework_version" })
  end
end

updated = 0

entries.each do |entry|
  next if DtProjectVersion.consumer_sync_forbidden?(entry, mode)

  rel = entry["path"]
  type = entry["type"] || (rel.end_with?(".json") ? "json" : nil)
  field = entry["field"] || "version"
  path = File.join(root, rel)
  next unless File.file?(path)

  case type
  when "json"
    j = JSON.parse(File.read(path))
    cur = j[field]
    next if cur == semver
    if dry
      puts "would set #{rel} #{field}: #{cur.inspect} -> #{semver}"
    else
      j[field] = semver
      File.write(path, JSON.pretty_generate(j) + "\n")
      puts "updated #{rel} #{field} -> #{semver}"
    end
    updated += 1
  when "readme_badge"
    lines = File.read(path).lines
    changed = false
    new_lines = lines.map do |line|
      if line.match?(/^\*\*v\d+\.\d+\.\d+\*\*\s*$/)
        nl = "**v#{semver}**\n"
        changed = true if line != nl
        nl
      else
        line
      end
    end
    next unless changed
    if dry
      puts "would update #{rel} badge -> v#{semver}"
    else
      File.write(path, new_lines.join)
      puts "updated #{rel} badge -> v#{semver}"
    end
    updated += 1
  when "yaml_frontmatter"
    content = File.read(path)
    unless content.start_with?("---\n")
      warn "skip #{rel}: no YAML frontmatter"
      next
    end
    body = content.split("---\n", 3)
    next if body.length < 3
    fm = YAML.load(body[1]) || {}
    cur = fm[field].to_s
    quoted = %("#{semver}")
    next if cur == semver || cur == quoted
    fm[field] = semver
    new_fm = fm.to_yaml.sub(/\A---\n/, "").strip
    new_content = "---\n#{new_fm}\n---\n#{body[2]}"
    if dry
      puts "would set #{rel} #{field}: #{cur} -> #{semver}"
    else
      File.write(path, new_content)
      puts "updated #{rel} #{field} -> #{semver}"
    end
    updated += 1
  else
    warn "skip #{rel}: unknown type #{type.inspect}"
  end
end

puts "OK: VERSION=#{semver} (#{updated} path(s) touched)"
RUBY
