#!/usr/bin/env ruby
# frozen_string_literal: true

# dt-doctor — verificador read-only del "orden" del repo DT.
# Motor del loop de orden continuo (.cursor/rules/07-orden-continuo).
# NO modifica archivos: solo reporta y devuelve un exit code.
#
# Exit code:
#   0  → orden en verde (sin ERRORES; puede haber WARN)
#   >0 → cantidad de categorías con ERROR
#
# Uso:
#   ruby scripts/dt-doctor.rb            # reporte legible + exit code
#   ruby scripts/dt-doctor.rb --quiet    # solo el resumen final

require "yaml"
require "date"
require "open3"

ROOT = File.expand_path("..", __dir__)
DOCS = File.join(ROOT, "docs")
TEMPLATES = File.join(DOCS, "99_meta", "templates")
QUIET = ARGV.include?("--quiet")

REQUIRED_FM = %w[id title type status owner updated tags summary related priority source_of_truth].freeze

@errors = []   # [categoria, detalle]
@warns  = []

def err(cat, detail)
  @errors << [cat, detail]
end

def warn_(cat, detail)
  @warns << [cat, detail]
end

def say(msg)
  puts msg unless QUIET
end

def frontmatter(path)
  text = File.read(path)
  return nil unless text.start_with?("---\n")

  closing = text.index("\n---", 4)
  return nil unless closing

  YAML.safe_load(text[4...closing], permitted_classes: [Date, Time]) || {}
rescue StandardError
  nil
end

# Payloads que NO son documentación (su contenido se copia verbatim a otro archivo):
# las plantillas de .cursorrules en 99_meta. No deben llevar frontmatter de doc.
PAYLOAD_RE = %r{/99_meta/cursorrules\..*\.md\z}.freeze

def doc_files
  Dir.glob(File.join(DOCS, "**", "*.md")).sort.reject do |p|
    p.start_with?(TEMPLATES + File::SEPARATOR) || p =~ PAYLOAD_RE
  end
end

# 1) Frontmatter completo
def check_frontmatter
  doc_files.each do |path|
    fm = frontmatter(path)
    rel = path.sub(ROOT + File::SEPARATOR, "")
    if fm.nil?
      err("frontmatter", "#{rel}: sin frontmatter YAML")
      next
    end
    missing = REQUIRED_FM.reject { |k| fm.key?(k) && !fm[k].to_s.strip.empty? }
    # 'tags'/'related' pueden ser listas vacías → solo exigir presencia de la clave
    missing -= %w[tags related]
    missing.reject! { |k| fm.key?(k) }
    err("frontmatter", "#{rel}: faltan campos #{missing.join(', ')}") unless missing.empty?
  end
end

# 2) Enlaces internos rotos
def check_links
  link_re = /\[[^\]]*\]\(([^)]+)\)/
  doc_files.each do |path|
    dir = File.dirname(path)
    rel = path.sub(ROOT + File::SEPARATOR, "")
    File.read(path).scan(link_re).each do |(target)|
      t = target.strip
      next if t.empty?
      next if t.start_with?("http://", "https://", "mailto:", "#")

      t = t.split("#", 2).first
      next if t.nil? || t.empty?

      resolved = File.expand_path(t, dir)
      unless File.exist?(resolved)
        err("links", "#{rel}: enlace roto → #{target}")
      end
    end
  end
end

# 3) Sub-scripts en modo --check (catálogo, commands, paridad multi-IDE)
def run_check(label, *cmd)
  script = cmd[1]
  unless script && File.exist?(script)
    warn_("toolchain", "#{label}: script ausente (#{script ? File.basename(script) : '??'}) — se omite")
    return
  end
  out, status = Open3.capture2e(*cmd)
  if status.success?
    say "  OK  #{label}"
  else
    err(label, out.strip.split("\n").last(3).join(" | "))
  end
end

def check_subscripts
  run_check("catalog", "ruby", File.join(ROOT, "scripts/sync-catalog.rb"), "--check")
  run_check("commands-parity", "ruby", File.join(ROOT, "scripts/sync-commands-from-meta.rb"), "--check")
  run_check("ide-parity", "ruby", File.join(ROOT, "scripts/sync-ide.rb"), "--check")
end

# 4) Frescura de telemetría (WARN, auto-fixable; no bloquea el loop)
def check_pulse_freshness
  version_file = File.join(ROOT, "VERSION")
  pulse = File.join(ROOT, "vitals/pulse/current.md")
  return unless File.exist?(version_file) && File.exist?(pulse)

  version = File.read(version_file).strip
  body = File.read(pulse)
  unless body.include?(version)
    warn_("pulse", "vitals/pulse/current.md no menciona VERSION #{version} (telemetría desactualizada)")
  end
end

def check_design_pack
  readme = File.join(ROOT, ".cursor/skills/design/README.md")
  err("atelier", "missing .cursor/skills/design/README.md") unless File.exist?(readme)

  select_script = File.join(ROOT, "scripts/dt-design-select.rb")
  err("atelier", "missing scripts/dt-design-select.rb") unless File.exist?(select_script)

  detect_script = File.join(ROOT, "scripts/atelier-detect.sh")
  err("atelier", "missing scripts/atelier-detect.sh") unless File.exist?(detect_script)

  lock = File.join(ROOT, "tools/atelier/impeccable-lock.yaml")
  err("atelier", "missing tools/atelier/impeccable-lock.yaml") unless File.exist?(lock)

  gen_refs = File.join(ROOT, "tools/atelier/generated/references")
  unless File.directory?(gen_refs)
    err("atelier", "missing tools/atelier/generated/references — run sync-from-impeccable.sh")
  else
    ref_count = Dir.glob(File.join(gen_refs, "*.md")).length
    min_refs = 23
    if File.exist?(lock)
      lock_data = YAML.load_file(lock)
      min_refs = lock_data["reference_count_min"].to_i if lock_data["reference_count_min"]
    end
    err("atelier", "generated/references count #{ref_count} < #{min_refs}") if ref_count < min_refs
  end

  atelier_skill = File.join(ROOT, ".cursor/skills/atelier/SKILL.md")
  err("atelier", "missing .cursor/skills/atelier/SKILL.md") unless File.exist?(atelier_skill)

  required_skills = %w[
    design-context design-selector design-read anti-slop system-templates style-templates
    ui-templates design-tokens component-specs
  ]
  required_skills.each do |s|
    path = File.join(ROOT, ".cursor/skills/design/#{s}/SKILL.md")
    err("atelier", "missing skill design/#{s}") unless File.exist?(path)
  end

  data_dir = File.join(ROOT, "vitals/data/design")
  %w[industries.yaml decision-matrix.yaml styles.yaml template-registry.yaml template-placeholders.yaml].each do |f|
    err("atelier", "missing vitals/data/design/#{f}") unless File.exist?(File.join(data_dir, f))
  end

  protocol = File.join(ROOT, ".cursor/skills/design/templates/PROTOCOL.md")
  err("atelier", "missing templates/PROTOCOL.md") unless File.exist?(protocol)

  %w[placeholders.md surface-homepage.md surface-presentation.md surface-dashboard.md].each do |f|
    path = File.join(ROOT, ".cursor/skills/design/templates/shared", f)
    err("atelier", "missing templates/shared/#{f}") unless File.exist?(path)
  end

  style_templates_skill = File.join(ROOT, ".cursor/skills/design/style-templates/SKILL.md")
  err("atelier", "missing skill design/style-templates") unless File.exist?(style_templates_skill)

  registry_path = File.join(data_dir, "template-registry.yaml")
  if File.exist?(registry_path)
    registry = YAML.load_file(registry_path)
    base = File.join(ROOT, ".cursor/skills/design/templates")
    (registry["systems"] || {}).each do |system_id, meta|
      folder = File.join(base, "systems", system_id)
      err("atelier", "missing system template folder #{system_id}") unless File.directory?(folder)
      (meta["files"] || {}).each do |_key, rel|
        file = File.join(base, rel)
        err("atelier", "missing system template #{rel}") unless File.exist?(file)
      end
    end
    (registry["styles"] || {}).each do |style_id, meta|
      folder = File.join(base, "styles", style_id)
      err("atelier", "missing style template folder #{style_id}") unless File.directory?(folder)
      (meta["files"] || {}).each do |_key, rel|
        file = File.join(base, rel)
        err("atelier", "missing style template #{rel}") unless File.exist?(file)
      end
    end
  end

  agent_registry = File.join(ROOT, ".cursor/skills/design/templates/registry.yaml")
  err("atelier", "missing design/templates/registry.yaml") unless File.exist?(agent_registry)

  preview_index = File.join(ROOT, ".cursor/skills/design/templates/preview/index.html")
  warn_("atelier", "preview/index.html missing (optional legacy gallery)") unless File.exist?(preview_index)

  out, status = Open3.capture2e("ruby", select_script, "test brief")
  err("atelier", "dt-design-select failed") unless status.success?
end

# 5) Agentes de código → skill canónica + regla reuse
CODE_AGENTS = {
  "arquitecto" => ".cursor/skills/arquitecto/SKILL.md",
  "frontend" => ".cursor/skills/frontend/SKILL.md",
  "devops" => ".cursor/skills/devops/SKILL.md",
  "qa" => ".cursor/skills/qa/SKILL.md",
  "remotion-producer" => ".cursor/skills/remotion-producer/SKILL.md"
}.freeze

def check_engineering_agents
  reuse_rule = File.join(ROOT, "vitals/specs/rule-bodies/15-engineering-reuse.body.md")
  err("engineering", "missing 15-engineering-reuse.body.md") unless File.exist?(reuse_rule)

  reuse_skill = File.join(ROOT, ".cursor/skills/engineering-reuse/SKILL.md")
  err("engineering", "missing .cursor/skills/engineering-reuse/SKILL.md") unless File.exist?(reuse_skill)

  CODE_AGENTS.each do |agent, skill_rel|
    agent_path = File.join(ROOT, ".cursor/agents/#{agent}.md")
    skill_path = File.join(ROOT, skill_rel)
    err("engineering", "missing agent #{agent}.md") unless File.exist?(agent_path)
    err("engineering", "missing skill #{skill_rel}") unless File.exist?(skill_path)
    next unless File.exist?(agent_path)

    body = File.read(agent_path)
    unless body.include?(skill_rel) || body.include?(".cursor/skills/#{agent}/SKILL.md")
      warn_("engineering", "#{agent}.md no apunta explícitamente a #{skill_rel}")
    end
  end
end

def check_upstream
  cfg_path = File.join(ROOT, "vitals/config/dt-upstream.md")
  return unless File.exist?(cfg_path)

  fm = frontmatter(cfg_path)
  return unless fm.is_a?(Hash)

  mode = fm["mode"].to_s.strip.downcase
  return unless mode == "consumer"

  remote = fm.dig("source", "remote").to_s.strip
  remote = "dt-upstream" if remote.empty?

  _out, _err, status = Open3.capture3("git", "-C", ROOT, "remote", "get-url", remote)
  unless status.success?
    warn_("upstream", "mode consumer pero falta remote Git '#{remote}' — /actualizar no puede avisar releases DT")
  end
rescue StandardError
  nil
end

# --- run ---
say "dt-doctor — verificación de orden (#{Time.now.strftime('%H:%M:%S')})"
check_frontmatter
check_links
check_subscripts
check_design_pack
check_engineering_agents
check_upstream
check_pulse_freshness

unless QUIET
  if @errors.empty? && @warns.empty?
    say "\nTodo en verde. Orden OK."
  else
    unless @errors.empty?
      say "\nERRORES (#{@errors.size}):"
      @errors.each { |c, d| say "  [#{c}] #{d}" }
    end
    unless @warns.empty?
      say "\nWARN (#{@warns.size}) — no bloquean el loop:"
      @warns.each { |c, d| say "  [#{c}] #{d}" }
    end
  end
end

error_categories = @errors.map(&:first).uniq
puts "RESUMEN: errores=#{@errors.size} (categorías: #{error_categories.empty? ? 'ninguna' : error_categories.join(',')}) warn=#{@warns.size}"
exit error_categories.size
