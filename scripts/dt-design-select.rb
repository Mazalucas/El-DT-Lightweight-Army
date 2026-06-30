#!/usr/bin/env ruby
# frozen_string_literal: true

# dt-design-select — motor compacto de recomendación Atelier.
# Lee vitals/data/design/*.yaml; NO carga todo en contexto del agente — invocar vía shell.
#
# Uso:
#   ruby scripts/dt-design-select.rb "fintech dashboard B2B"
#   ruby scripts/dt-design-select.rb "beauty spa landing" --product "Serenity Spa"
#   ruby scripts/dt-design-select.rb "shopify admin app" --format markdown
#   ruby scripts/dt-design-select.rb "..." --context .agents/design-context.md

require "yaml"
require "optparse"

ROOT = File.expand_path("..", __dir__)
DATA = File.join(ROOT, "vitals/data/design")

options = { format: "ascii", product: nil, context: nil }
parser = OptionParser.new do |o|
  o.banner = "Usage: ruby scripts/dt-design-select.rb BRIEF [options]"
  o.on("-p", "--product NAME", "Product/project name for header") { |v| options[:product] = v }
  o.on("-f", "--format FORMAT", "ascii|markdown") { |v| options[:format] = v }
  o.on("-c", "--context PATH", "Path to design-context.md") { |v| options[:context] = v }
end
parser.parse!
brief = ARGV.join(" ").strip
abort parser.help if brief.empty?

def load_yaml(name)
  path = File.join(DATA, name)
  abort "Missing #{path}" unless File.exist?(path)

  YAML.load_file(path)
end

def normalize(text)
  text.to_s.downcase
end

def score_signals(text, signals)
  return 0 if signals.nil? || signals.empty?

  n = normalize(text)
  signals.sum { |s| n.include?(normalize(s)) ? normalize(s).length : 0 }
end

matrix = load_yaml("decision-matrix.yaml")
industries = load_yaml("industries.yaml")
palettes = load_yaml("palettes.yaml")
template_registry = load_yaml("template-registry.yaml")

STYLE_ALIASES = {
  "neumorphism-partial" => "neumorphism"
}.freeze

def resolve_style_id(raw, registry)
  id = raw.to_s
  id = STYLE_ALIASES[id] || id
  return id if registry.dig("styles", id)

  registry["styles"]&.each_key do |key|
    return key if id.include?(key) || key.include?(id)
  end
  nil
end

def template_paths_for(style_id, surface, registry)
  meta = registry.dig("styles", style_id)
  return [] unless meta

  base = registry["base_path"] || ".cursor/skills/design/templates"
  files = meta["files"] || {}
  surface_key = case surface
                when "brand" then "landing"
                else "product_shell"
                end
  ordered = []
  ordered << surface_key if files.key?(surface_key)
  files.keys.each { |k| ordered << k unless ordered.include?(k) }

  ordered.map do |key|
    rel = files[key]
    next unless rel
    next unless rel.end_with?(".md")

    { key: key, path: File.join(base, rel) }
  end.compact
end

def system_template_paths_for(system_id, surface, registry)
  meta = registry.dig("systems", system_id.to_s)
  return [] unless meta

  base = registry["base_path"] || ".cursor/skills/design/templates"
  files = meta["files"] || {}
  primary = surface == "brand" ? "homepage" : "dashboard_saas"
  ordered = []
  ordered << primary if files.key?(primary)
  %w[homepage presentation dashboard_saas].each { |k| ordered << k if files.key?(k) && !ordered.include?(k) }

  ordered.map do |key|
    rel = files[key]
    next unless rel

    { key: key, path: File.join(base, rel) }
  end.compact
end

def shared_surface_specs(registry)
  base = registry["base_path"] || ".cursor/skills/design/templates"
  %w[surface-homepage surface-presentation surface-dashboard].map do |name|
    File.join(base, "shared", "#{name}.md")
  end
end

context_text = ""
if options[:context] && File.exist?(options[:context])
  context_text = File.read(options[:context])
end
combined = [brief, context_text].join(" ")

# 1) Ecosystem lock-in
lock = nil
(matrix["ecosystem_lock"] || []).each do |rule|
  next unless score_signals(combined, rule["signals"]).positive?

  lock = rule
  break
end

# 2) Industry match
best_industry = nil
best_score = 0
(industries["industries"] || []).each do |ind|
  sc = score_signals(combined, ind["signals"])
  next unless sc > best_score

  best_score = sc
  best_industry = ind
end
best_industry ||= (industries["industries"] || []).find { |i| i["id"] == "startup-mvp" }

# 3) Surface type
surface = "product"
brand_signals = matrix.dig("surface_types", "brand", "signals") || []
surface = "brand" if score_signals(combined, brand_signals).positive?

# 4) A11y strict
a11y_strict = score_signals(combined, matrix.dig("a11y_strict", "signals") || []).positive?

design_system = lock ? lock["design_system"] : best_industry["design_system"]
visual = lock ? lock["visual_overlay"] : best_industry["visual_overlay"]
visual = [visual].flatten.join(" + ")
library = lock ? lock["library"] : nil

avoid = (matrix["default_avoid"] || []) + (best_industry["avoid"] || [])
if a11y_strict
  avoid += matrix.dig("a11y_strict", "exclude_styles") || []
end
avoid = avoid.uniq

palette_key = best_industry["palette_mood"]
palette = palettes.dig("palettes", palette_key) || { "note" => "Define in design-context" }
typo = best_industry["typography"] || "Geist / system stack"

product_name = options[:product] || brief.split.first(4).join(" ")
pattern = best_industry["pattern"] || "minimal-direct"

visual_raw = lock ? lock["visual_overlay"] : best_industry["visual_overlay"]
visual_ids = [visual_raw].flatten.map(&:to_s)
primary_style = visual_ids.map { |v| resolve_style_id(v, template_registry) }.compact.first
template_paths = primary_style ? template_paths_for(primary_style, surface, template_registry) : []
system_paths = system_template_paths_for(design_system, surface, template_registry)

lines = []
if options[:format] == "markdown"
  lines << "# Atelier Design Recommendation"
  lines << ""
  lines << "**Target:** #{product_name}"
  lines << "**Brief:** #{brief}"
  lines << "**Surface:** #{surface}"
  lines << "**Pattern:** #{pattern}"
  lines << "**Design system:** #{design_system}#{lock ? ' (locked)' : ''}"
  lines << "**Visual overlay:** #{visual}"
  lines << "**Typography:** #{typo}"
  lines << "**Palette:** #{palette.is_a?(Hash) ? palette.reject { |k| k == 'note' }.map { |k, v| "#{k}=#{v}" }.join(', ') : palette}"
  lines << "**Library:** #{library}" if library
  if system_paths.any?
    lines << "**System templates:** #{design_system} (skill: system-templates · Markdown-only)"
    proto = template_registry["protocol"] || File.join(template_registry["base_path"] || ".cursor/skills/design/templates", "PROTOCOL.md")
    lines << "**PROTOCOL:** #{proto}"
    placeholders = template_registry["placeholders_md"] || File.join(template_registry["base_path"] || ".cursor/skills/design/templates", "shared/placeholders.md")
    lines << "**PLACEHOLDERS:** #{placeholders}"
    shared_surface_specs(template_registry).each { |p| lines << "**SPEC:** #{p}" }
    system_paths.each do |t|
      lines << "**TEMPLATE #{t[:key]}:** #{t[:path]}"
    end
  end
  if primary_style
    lines << "**Style template:** #{primary_style} (skill: style-templates)"
    template_paths.each { |t| lines << "**TEMPLATE #{t[:key]}:** #{t[:path]}" }
  end
  lines << ""
  lines << "## Avoid"
  avoid.each { |a| lines << "- #{a}" }
  lines << ""
  lines << "## Pre-delivery checklist"
  lines << "- [ ] Contrast 4.5:1 minimum (text)"
  lines << "- [ ] Focus states visible"
  lines << "- [ ] prefers-reduced-motion respected"
  lines << "- [ ] cursor-pointer on clickables"
  lines << "- [ ] Responsive: 375, 768, 1024, 1440"
  lines << "- [ ] No emojis as icons (use SVG)"
  lines << ""
  lines << "**HANDOFF:** ui-designer → frontend"
else
  width = 72
  bar = "+" + ("-" * (width - 2)) + "+"
  lines << bar
  lines << "|  ATELIER DESIGN RECOMMENDATION#{' ' * (width - 33)}|"
  lines << bar
  lines << "|  TARGET: #{product_name.to_s.ljust(width - 12)}|"
  lines << "|  BRIEF: #{brief[0, width - 11].ljust(width - 11)}|"
  lines << "|  SURFACE: #{surface.ljust(width - 14)}|"
  lines << "|  PATTERN: #{pattern.to_s.ljust(width - 13)}|"
  lines << "|  SYSTEM: #{design_system.to_s.ljust(width - 12)}#{lock ? '(lock)' : ''}|"
  lines << "|  VISUAL: #{visual[0, width - 12].ljust(width - 12)}|"
  lines << "|  TYPO: #{typo.to_s[0, width - 10].ljust(width - 10)}|"
  if palette.is_a?(Hash) && palette["primary"]
    lines << "|  COLORS: primary #{palette['primary']}#{' ' * (width - 22 - palette['primary'].length)}|"
  end
  lines << "|  LIBRARY: #{library.to_s[0, width - 13].ljust(width - 13)}|" if library
  if primary_style
    lines << "|  TEMPLATE: #{primary_style.ljust(width - 14)}|"
    template_paths.first(3).each do |t|
      label = "  #{t[:key]}: #{t[:path]}"
      lines << "|  #{label[0, width - 4].ljust(width - 4)}|"
    end
  end
  lines << "+#{'-' * (width - 2)}+"
  lines << "|  AVOID:#{' ' * (width - 9)}|"
  avoid.first(6).each do |a|
    lines << "|    - #{a[0, width - 8].ljust(width - 8)}|"
  end
  lines << "+#{'-' * (width - 2)}+"
  lines << "|  CHECKLIST: contrast, focus, reduced-motion, responsive#{' ' * 10}|"
  lines << "|  HANDOFF: ui-designer → frontend#{' ' * (width - 35)}|"
  lines << bar
end

puts lines.join("\n")
