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

require_relative "lib/force_utf8"
require "yaml"
require "date"
require "time"
require "open3"
require_relative "project-version"

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
  %w[scripts/lib/force_utf8.rb scripts/lib/force_utf8.sh].each do |rel|
    err("scripts", "falta #{rel}") unless File.exist?(File.join(ROOT, rel))
  end
  run_check("catalog", "ruby", File.join(ROOT, "scripts/sync-catalog.rb"), "--check")
  run_check("commands-parity", "ruby", File.join(ROOT, "scripts/sync-commands-from-meta.rb"), "--check")
  run_check("ide-parity", "ruby", File.join(ROOT, "scripts/sync-ide.rb"), "--check")
  run_check("skills-standard", "ruby", File.join(ROOT, "scripts/audit-skills.rb"))
end

# 4) Frescura de telemetría (WARN, auto-fixable; no bloquea el loop)
def check_pulse_freshness
  version_file = File.join(ROOT, "VERSION")
  pulse = File.join(ROOT, "vitals/pulse/current.md")
  return unless File.exist?(version_file) && File.exist?(pulse)

  version = File.read(version_file).strip
  body = File.read(pulse)
  unless body.include?(version)
    detail = "vitals/pulse/current.md no menciona VERSION #{version} (telemetría desactualizada)"
    upstream = File.join(ROOT, "vitals/config/dt-upstream.md")
    mode = File.exist?(upstream) ? (frontmatter(upstream) || {})["mode"] : nil
    # En el repo canónico /guardar no puede cerrar con el pulse atrasado; en consumer sigue siendo aviso.
    mode == "canonical" ? err("pulse", detail) : warn_("pulse", detail)
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
    path = File.join(ROOT, ".cursor/skills/design/#{s}/GUIDE.md")
    err("atelier", "missing guide design/#{s}") unless File.exist?(path)
  end

  style_templates_guide = File.join(ROOT, ".cursor/skills/design/style-templates/GUIDE.md")
  err("atelier", "missing guide design/style-templates") unless File.exist?(style_templates_guide)

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

# 6) Integridad del catálogo de subagentes: cada agente tiene skill de rol y
# los conteos publicados coinciden (evita el drift que aparece al sumar un rol).
def check_agent_catalog
  agents_dir = File.join(ROOT, ".cursor/agents")
  return unless Dir.exist?(agents_dir)

  agents = Dir.glob(File.join(agents_dir, "*.md")).map { |p| File.basename(p, ".md") }
              .reject { |n| n.start_with?("_") || n == "README" }.sort

  agents.each do |agent|
    skill = File.join(ROOT, ".cursor/skills/#{agent}/SKILL.md")
    err("agents", "#{agent}.md sin skill de rol (.cursor/skills/#{agent}/SKILL.md)") unless File.exist?(skill)
  end

  expected = agents.size
  {
    ".cursor/agents/README.md" => /Subagentes del DT \((\d+)\)/,
    "README.md" => /Catálogo de los (\d+) especialistas/
  }.each do |rel, re|
    path = File.join(ROOT, rel)
    next unless File.exist?(path)

    found = File.read(path)[re, 1]
    next if found.nil?
    next if found.to_i == expected

    err("agents", "#{rel} declara #{found} especialistas y hay #{expected} en .cursor/agents/")
  end
end

def check_publish_gate
  cfg_path = File.join(ROOT, "vitals/config/canonical-publish.yaml")
  unless File.exist?(cfg_path)
    err("publish", "falta vitals/config/canonical-publish.yaml")
    return
  end

  cfg = YAML.safe_load(File.read(cfg_path), permitted_classes: [])
  unless cfg.is_a?(Hash)
    err("publish", "canonical-publish.yaml ilegible")
    return
  end

  login = cfg["publisher_github_login"].to_s.strip
  remotes = cfg["official_remotes"]
  err("publish", "publisher_github_login vacío") if login.empty?
  err("publish", "official_remotes vacío") unless remotes.is_a?(Array) && !remotes.empty?

  %w[scripts/dt-canonical-publish.rb scripts/dt-publish-gate.sh scripts/dt-oficial.sh].each do |rel|
    err("publish", "falta #{rel}") unless File.exist?(File.join(ROOT, rel))
  end

  gi = File.read(File.join(ROOT, ".gitignore"))
  unless gi.include?("vitals/ops/canonical-checkout.yaml")
    err("publish", ".gitignore no ignora vitals/ops/canonical-checkout.yaml")
  end

  run_check("publish-gate", "ruby", File.join(ROOT, "scripts/dt-canonical-publish.rb"), "self-check")
rescue StandardError => e
  err("publish", e.message)
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

  DtProjectVersion.doctor_findings(ROOT).each do |level, msg|
    if level == :error
      err("version", msg)
    else
      warn_("version", msg)
    end
  end
rescue StandardError
  nil
end

def check_collaboration
  example = File.join(ROOT, "vitals/config/collaboration.yaml.example")
  paths = [example, File.join(ROOT, "vitals/config/collaboration.yaml")]
  unless File.exist?(example)
    err("collaboration", "falta vitals/config/collaboration.yaml.example")
  end

  paths.each do |path|
    next unless File.exist?(path)

    rel = path.sub("#{ROOT}#{File::SEPARATOR}", "")
    data = YAML.safe_load(File.read(path), permitted_classes: [])
    unless data.is_a?(Hash)
      err("collaboration", "#{rel} ilegible")
      next
    end

    posture = data["posture"].to_s.strip
    unless %w[personal team].include?(posture)
      err("collaboration", "#{rel}: posture debe ser personal o team")
    end
  end
rescue StandardError => e
  err("collaboration", e.message)
end

# Contrato: vitals/specs/agent-inbox.md
AGENT_STATUSES = %w[pending active paused retired].freeze
MSG_TYPES = %w[request handoff question fyi cancel escalate].freeze
MSG_STATUSES = %w[open claimed paused done declined cancelled].freeze
MSG_REQUIRED = %w[from to type status created].freeze
STALE_OPEN_DAYS = 14
STALE_CLAIMED_DAYS = 7
STALE_CLAIMED_REG_DAYS = 3
PAUSED_WARN_DAYS = 30
MAX_PAUSED = 5
MAX_PENDING_PER_SENDER = 3
URGENT_OPEN_WARN_HOURS = 24
MAX_THREAD = 5
UNCOMMITTED_INBOX_MINUTES = 30

def shallow_repo?
  out, status = Open3.capture2e("git", "-C", ROOT, "rev-parse", "--is-shallow-repository")
  status.success? && out.strip == "true"
end

# Trailer `DT-Member: <id>` del commit que introdujo el archivo; nil si no está versionado o no lo trae.
def git_trailer_for_added(path)
  out, status = Open3.capture2e("git", "-C", ROOT, "log", "--diff-filter=A", "--format=%B", "-1", "--", path)
  return nil unless status.success? && !out.strip.empty?

  out[/^DT-Member:\s*(\S+)/, 1]
end

def shared_runtime_pair?(from_id, committer_id, members)
  a = members[from_id.to_s]
  b = members[committer_id.to_s]
  return false unless a && b
  return false if (a["kind"] || "human") == "human" || (b["kind"] || "human") == "human"

  a["owner"].to_s == b["owner"].to_s && a["runtime"].to_s == b["runtime"].to_s && !a["runtime"].to_s.empty?
end

def registro_last_at(body)
  return nil unless body.include?("## Registro")

  times = body.scan(/^- (\d{4}-\d{2}-\d{2}T[^\s]+)/).flatten
  return nil if times.empty?

  Time.parse(times.last) rescue nil
end

# Email del autor del commit que escribió la línea; :uncommitted si aún no está commiteada; nil si no se puede saber.
def blame_author_email(rel, line_no)
  out, status = Open3.capture2e("git", "-C", ROOT, "blame", "-L", "#{line_no},#{line_no}", "--porcelain", "--", rel)
  return nil unless status.success?
  return :uncommitted if out.start_with?("0" * 40)

  out[/^author-mail <(.*)>$/, 1]
end

# Línea (1-based) de `status:` dentro del bloque del miembro en el roster.
def roster_status_line(id)
  lines = File.read(File.join(ROOT, "vitals/config/roster.yaml")).lines
  start = lines.index { |l| l =~ /^\s*-\s*id:\s*["']?#{Regexp.escape(id)}["']?\s*$/ }
  return nil unless start

  finish = (start + 1...lines.size).find { |i| lines[i] =~ /^\s*-\s/ || lines[i] =~ /^\S/ } || lines.size
  idx = (start...finish).find { |i| lines[i] =~ /^\s+status:/ }
  idx && idx + 1
end

# El commit que cambió el estado de un agente debe ser del email de su owner.
def check_status_author(id, m, members)
  return if m["status"].to_s == "pending"

  owner = members[m["owner"].to_s]
  owner_email = owner && owner["email"].to_s.strip.downcase
  if owner_email.nil? || owner_email.empty?
    warn_("agents", "roster #{id}: el owner #{m['owner']} no tiene email; no se puede verificar quién cambió el estado")
    return
  end
  line = roster_status_line(id)
  return unless line

  if shallow_repo?
    warn_("agents", "clone superficial: no se verifica blame del roster (corré git fetch --unshallow si aplica)")
    return
  end

  author = blame_author_email("vitals/config/roster.yaml", line)
  return if author.nil? || author == :uncommitted

  unless author.downcase == owner_email
    err("agents", "roster #{id}: el estado lo commiteó #{author}, no el owner #{m['owner']} (#{owner_email})")
  end
end

def check_agent_inbox
  roster_path = File.join(ROOT, "vitals/config/roster.yaml")
  team = File.exist?(roster_path) ? (YAML.safe_load(File.read(roster_path), permitted_classes: [Date, Time]) || {})["team"] || [] : []
  members = {}
  team.each { |m| members[m["id"].to_s] = m if m.is_a?(Hash) && !m["id"].to_s.empty? }
  humans = members.select { |_, m| (m["kind"] || "human") == "human" }.keys

  members.each do |id, m|
    kind = m["kind"] || "human"
    unless %w[human agent].include?(kind)
      err("agents", "roster #{id}: kind debe ser human o agent")
      next
    end
    next unless kind == "agent"

    missing = %w[owner runtime scope status].reject { |k| m[k].to_s.strip != "" }
    err("agents", "roster #{id}: faltan #{missing.join(', ')}") unless missing.empty?
    err("agents", "roster #{id}: status inválido (#{m['status']})") if m["status"] && !AGENT_STATUSES.include?(m["status"].to_s)
    err("agents", "roster #{id}: owner #{m['owner']} no es un humano del roster") if m["owner"] && !humans.include?(m["owner"].to_s)
    if m["status"].to_s != "pending" && m["status_by"].to_s != m["owner"].to_s
      err("agents", "roster #{id}: status #{m['status']} sin status_by del owner — editado a mano; usar dt-agent.sh activate|pause|retire")
    end
    check_status_author(id, m, members)
  end

  msgs = Dir.glob(File.join(ROOT, "vitals/work/inbox/*/**/*.md")).reject do |p|
    b = File.basename(p)
    b.start_with?("draft-") || b.casecmp("README.md").zero?
  end
  by_name = {}
  lane_open = Hash.new(0)   # urgentes open/claimed por miembro (carril de un solo lugar)
  paused_count = Hash.new(0)
  msgs.each do |path|
    parts = path.sub("#{ROOT}#{File::SEPARATOR}", "").split("/")
    pfm = frontmatter(path)
    next unless pfm

    lane_open[parts[3]] += 1 if parts[4] == "priority" && %w[open claimed].include?(pfm["status"].to_s)
    paused_count[parts[3]] += 1 if pfm["status"].to_s == "paused"
  end
  lane_open.each { |id, n| err("inbox", "#{id}: #{n} urgentes abiertos en priority/ (el carril admite uno)") if n > 1 }
  paused_count.each { |id, n| err("inbox", "#{id}: #{n} mensajes en pausa (tope #{MAX_PAUSED})") if n > MAX_PAUSED }

  pending_pair = Hash.new(0)
  msgs.each do |path|
    rel = path.sub("#{ROOT}#{File::SEPARATOR}", "")
    owner_dir = rel.split("/")[3]
    in_lane = rel.split("/")[4] == "priority"
    fm = frontmatter(path)
    text = File.read(path)
    if fm.nil?
      err("inbox", "#{rel}: sin frontmatter")
      next
    end
    if !in_lane && %w[open claimed].include?(fm["status"].to_s)
      pending_pair["#{fm['from']}→#{fm['to']}"] += 1
    end
    missing = MSG_REQUIRED.reject { |k| fm[k].to_s.strip != "" }
    unless missing.empty?
      err("inbox", "#{rel}: faltan #{missing.join(', ')}")
      next
    end
    err("inbox", "#{rel}: to=#{fm['to']} no coincide con la carpeta #{owner_dir}") unless fm["to"].to_s == owner_dir
    err("inbox", "#{rel}: type inválido (#{fm['type']})") unless MSG_TYPES.include?(fm["type"].to_s)
    err("inbox", "#{rel}: status inválido (#{fm['status']})") unless MSG_STATUSES.include?(fm["status"].to_s)
    warn_("inbox", "#{rel}: from=#{fm['from']} no está en el roster") unless members.key?(fm["from"].to_s)

    created = fm["created"].is_a?(Time) ? fm["created"] : (Time.parse(fm["created"].to_s) rescue nil)
    age_days = created ? (Time.now - created) / 86_400 : 0
    if in_lane
      err("inbox", "#{rel}: en priority/ solo van mensajes type: escalate") unless fm["type"].to_s == "escalate"
      %w[escalates reason expires].each { |k| err("inbox", "#{rel}: urgente sin #{k}") if fm[k].to_s.strip.empty? }
      err("inbox", "#{rel}: el urgente no se pausa (tomarlo o rechazarlo)") if fm["status"].to_s == "paused"
      if fm["escalates"].to_s != "" && !Dir.glob(File.join(ROOT, "vitals/work/inbox", owner_dir, "{,archive/}#{fm['escalates']}")).any?
        warn_("inbox", "#{rel}: escalates #{fm['escalates']} no existe en el inbox de #{owner_dir}")
      end
    elsif fm["type"].to_s == "escalate"
      err("inbox", "#{rel}: type escalate solo va en priority/")
    end

    case fm["status"].to_s
    when "open"
      limit_h = in_lane ? URGENT_OPEN_WARN_HOURS : STALE_OPEN_DAYS * 24
      warn_("inbox", "#{rel}: #{in_lane ? 'urgente sin tomar' : 'open'} hace más de #{in_lane ? "#{URGENT_OPEN_WARN_HOURS} horas" : "#{STALE_OPEN_DAYS} días"}") if age_days * 24 > limit_h
      expires = (Time.parse(fm["expires"].to_s) rescue nil) if fm["expires"]
      warn_("inbox", "#{rel}: venció (expires #{fm['expires']}); cerrar con decline") if expires && expires < Time.now
    when "claimed"
      # Mientras el carril urgente de ese miembro está ocupado, lo que tenía en curso no envejece.
      busy = lane_open[owner_dir].positive? && !in_lane
      warn_("inbox", "#{rel}: claimed hace más de #{STALE_CLAIMED_DAYS} días sin cerrar") if age_days > STALE_CLAIMED_DAYS && !busy
      body_after = text[(text.index("\n---", 4) + 4)..].to_s
      last_reg = registro_last_at(body_after) || created
      reg_age = last_reg ? (Time.now - last_reg) / 86_400 : age_days
      if reg_age > STALE_CLAIMED_REG_DAYS && !busy
        warn_("inbox", "#{rel}: claimed sin actividad en ## Registro hace más de #{STALE_CLAIMED_REG_DAYS} días; considerá `park`")
      end
    when "cancelled"
      err("inbox", "#{rel}: cancelled sin cancelled_by") if fm["cancelled_by"].to_s.strip.empty?
    when "paused"
      %w[paused_reason paused_from].each { |k| err("inbox", "#{rel}: en pausa sin #{k}") if fm[k].to_s.strip.empty? }
      paused_at = (Time.parse(fm["paused_at"].to_s) rescue nil)
      warn_("inbox", "#{rel}: en pausa hace más de #{PAUSED_WARN_DAYS} días; retomar o cerrar") if paused_at && (Time.now - paused_at) / 86_400 > PAUSED_WARN_DAYS
      resume = (Time.parse(fm["resume_after"].to_s) rescue nil) if fm["resume_after"]
      warn_("inbox", "#{rel}: ya pasó resume_after (#{fm['resume_after']}); es hora de retomar") if resume && resume < Time.now
    end

    st = fm["status"].to_s
    check_trailer = %w[open claimed paused].include?(st) || age_days < 7
    if check_trailer && !rel.include?("/archive/") && !shallow_repo?
      added_by = git_trailer_for_added(rel)
      if added_by && added_by != fm["from"].to_s && !shared_runtime_pair?(fm["from"], added_by, members)
        warn_("inbox", "#{rel}: from=#{fm['from']} pero el commit que lo agregó dice DT-Member: #{added_by}")
      end
    end
    by_name[File.basename(path)] = fm
  end

  pending_pair.each do |pair, n|
    err("inbox", "#{pair}: #{n} pendientes (tope #{MAX_PENDING_PER_SENDER})") if n > MAX_PENDING_PER_SENDER
  end

  git_inbox = Open3.capture2e("git", "-C", ROOT, "status", "--porcelain", "vitals/work/inbox")[0]
  git_inbox.lines.each do |line|
    rel = line[3..].strip.split(" -> ").last
    next unless rel&.start_with?("vitals/work/inbox/") && rel.end_with?(".md")

    full = File.join(ROOT, rel)
    next unless File.exist?(full)

    age_min = (Time.now - File.mtime(full)) / 60
    warn_("inbox", "#{rel}: sin commitear hace #{age_min.round} min; publicá con `dt-agent sync`") if age_min > UNCOMMITTED_INBOX_MINUTES
  end

  by_name.each do |name, fm|
    depth = 1
    seen = [name]
    parent = fm["reply_to"].to_s
    while !parent.empty? && by_name.key?(parent) && !seen.include?(parent)
      seen << parent
      depth += 1
      parent = by_name[parent]["reply_to"].to_s
    end
    warn_("inbox", "#{name}: hilo de #{depth} mensajes (tope #{MAX_THREAD}); escalar al owner") if depth > MAX_THREAD
  end
rescue StandardError => e
  err("agents", e.message)
end

# --- run ---
say "dt-doctor — verificación de orden (#{Time.now.strftime('%H:%M:%S')})"
check_frontmatter
check_links
check_subscripts
check_design_pack
check_engineering_agents
check_agent_catalog
check_upstream
check_publish_gate
check_collaboration
check_agent_inbox
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
