#!/usr/bin/env ruby
# frozen_string_literal: true

# Deriva docs/99_meta/catalog.yaml desde el frontmatter de docs/**/*.md.
# El catálogo es un ARTEFACTO: no se edita a mano.
#
# Uso:
#   ruby scripts/sync-catalog.rb            # regenera catalog.yaml
#   ruby scripts/sync-catalog.rb --check    # falla (exit 1) si hay drift
#   ruby scripts/sync-catalog.rb --next OV  # imprime el próximo DOC-OV-NNN libre

require "yaml"
require "date"

ROOT = File.expand_path("..", __dir__)
DOCS = File.join(ROOT, "docs")
CATALOG = File.join(DOCS, "99_meta", "catalog.yaml")
EXCLUDE_DIRS = [File.join(DOCS, "99_meta", "templates")].freeze

def frontmatter(path)
  text = File.read(path)
  return nil unless text.start_with?("---\n")

  closing = text.index("\n---", 4)
  return nil unless closing

  raw = text[4...closing]
  YAML.safe_load(raw, permitted_classes: [Date, Time]) || {}
rescue StandardError => e
  warn "WARN frontmatter ilegible en #{path}: #{e.message}"
  nil
end

def collect_docs
  docs = []
  Dir.glob(File.join(DOCS, "**", "*.md")).sort.each do |path|
    next if EXCLUDE_DIRS.any? { |d| path.start_with?(d + File::SEPARATOR) }

    fm = frontmatter(path)
    next unless fm && fm["id"]

    id = fm["id"].to_s
    next if id.end_with?("-000") # placeholders de plantilla

    docs << {
      "id" => id,
      "title" => fm["title"].to_s,
      "path" => path.sub(DOCS + File::SEPARATOR, ""),
      "type" => fm["type"].to_s,
      "tags" => Array(fm["tags"]).map(&:to_s)
    }
  end
  docs.sort_by { |d| d["id"] }
end

def render(docs)
  out = +"# Catálogo de documentos (ARTEFACTO derivado — no editar a mano)\n"
  out << "# Generado por scripts/sync-catalog.rb desde el frontmatter de docs/**/*.md\n"
  out << "# Convención id: DOC-<DOMINIO>-<NNN> — ver id-registry.md\n\n"
  out << "version: 1\n"
  out << "updated: \"#{Date.today.iso8601}\"\n"
  out << "documents:\n"
  docs.each do |d|
    out << "  - id: #{d['id']}\n"
    out << "    title: #{d['title'].inspect}\n"
    out << "    path: #{d['path']}\n"
    out << "    type: #{d['type']}\n"
    tags = d["tags"].map { |t| t }.join(", ")
    out << "    tags: [#{tags}]\n"
  end
  out
end

def detect_duplicates(docs)
  ids = docs.map { |d| d["id"] }
  dups = ids.group_by(&:itself).select { |_, v| v.size > 1 }.keys
  dups
end

docs = collect_docs

if (idx = ARGV.index("--next"))
  domain = ARGV[idx + 1]
  abort "Uso: --next <DOMINIO>" unless domain
  prefix = "DOC-#{domain.upcase}-"
  nums = docs.map { |d| d["id"] }
            .select { |id| id.start_with?(prefix) }
            .map { |id| id.sub(prefix, "").to_i }
  nextn = (nums.max || 0) + 1
  puts format("%s%03d", prefix, nextn)
  exit 0
end

dups = detect_duplicates(docs)
unless dups.empty?
  warn "ERROR: IDs duplicados en docs/: #{dups.join(', ')}"
  exit 2
end

expected = render(docs)
check_only = ARGV.include?("--check")

current = File.exist?(CATALOG) ? File.read(CATALOG) : ""
if current == expected
  puts "catalog: OK (#{docs.size} docs)"
  exit 0
end

if check_only
  warn "catalog DRIFT: corré 'ruby scripts/sync-catalog.rb' (#{docs.size} docs detectados)"
  exit 1
end

File.write(CATALOG, expected)
puts "catalog: regenerado (#{docs.size} docs) → #{CATALOG.sub(ROOT + File::SEPARATOR, '')}"
