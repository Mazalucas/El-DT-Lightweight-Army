#!/usr/bin/env ruby
# frozen_string_literal: true

# sync-ide — emisor único multi-IDE del DT.
# Recorre el registro vitals/config/ide-targets.yaml y emite cada destino
# desde fuentes canónicas:
#   - reglas: vitals/specs/rule-bodies/<stem>.body.md + vitals/config/rules-manifest.yaml
#   - skills: .cursor/skills/ (canónico)
#   - commands (Claude): .cursor/commands/
#   - punteros de entrada: CLAUDE.md, .github/copilot-instructions.md, …
#
# Agregar un IDE = agregar una entrada en ide-targets.yaml (no tocar este script).
#
# Uso:
#   ruby scripts/sync-ide.rb           # genera/actualiza
#   ruby scripts/sync-ide.rb --check   # falla (exit 1) si hay drift

require "yaml"
require "fileutils"

ROOT = File.expand_path("..", __dir__)
TARGETS = YAML.load_file(File.join(ROOT, "vitals/config/ide-targets.yaml"))["targets"] || {}
MANIFEST = YAML.load_file(File.join(ROOT, "vitals/config/rules-manifest.yaml"))["rules"] || []
BODY_DIR = File.join(ROOT, "vitals/specs/rule-bodies")
SKILLS_SRC = File.join(ROOT, ".cursor/skills")
COMMANDS_SRC = File.join(ROOT, ".cursor/commands")
AGENTS_SRC = File.join(ROOT, ".cursor/agents")
CHECK_ONLY = ARGV.include?("--check")

@drift = []
@written = 0

def rel(path)
  path.sub(ROOT + File::SEPARATOR, "")
end

def write_file(path, content)
  if File.exist?(path) && File.read(path) == content
    return
  end

  @drift << rel(path)
  if CHECK_ONLY
    puts "DRIFT #{rel(path)}"
  else
    FileUtils.mkdir_p(File.dirname(path))
    File.write(path, content)
    @written += 1
    puts "wrote #{rel(path)}"
  end
end

def rule_body(stem)
  f = File.join(BODY_DIR, "#{stem}.body.md")
  abort "Falta cuerpo de regla: #{rel(f)}" unless File.exist?(f)

  File.read(f)
end

def cursor_frontmatter(rule)
  lines = ["---", "description: #{rule['description']}"]
  lines << "globs: \"#{rule['globs']}\"" if rule["globs"]
  lines << "alwaysApply: #{rule.fetch('alwaysApply', true)}"
  lines << "---"
  lines.join("\n") + "\n"
end

def agent_frontmatter(rule)
  desc = rule["agent_description"] || rule["description"]
  lines = ["---", "description: #{desc}"]
  lines << "globs: \"#{rule['globs']}\"" if rule["globs"]
  lines << "alwaysApply: #{rule.fetch('alwaysApply', true)}"
  lines << "---"
  lines.join("\n") + "\n"
end

def emit_rules(cfg)
  rules_cfg = cfg["rules"]
  return unless rules_cfg

  dir = File.join(ROOT, rules_cfg["dir"])
  ext = rules_cfg["ext"]
  fmt = rules_cfg["frontmatter"]
  MANIFEST.each do |rule|
    body = rule_body(rule["stem"])
    fm = fmt == "cursor" ? cursor_frontmatter(rule) : agent_frontmatter(rule)
    write_file(File.join(dir, "#{rule['stem']}#{ext}"), fm + "\n" + body)
  end
end

# Espejo de skills canónicas: raíz = solo SKILL.md salvo subárbol (p. ej. remotion/rules/);
# marketing/*, design/* = árbol completo.
TACTICAL_PACKS = %w[marketing design].freeze

def skill_needs_full_tree?(dir)
  Dir.children(dir).any? { |entry| entry != "SKILL.md" }
end

def emit_skill_tree(src_root, dst_dir)
  Dir.glob(File.join(src_root, "**", "*")).sort.each do |f|
    next unless File.file?(f)

    relpath = f.sub(src_root + File::SEPARATOR, "")
    write_file(File.join(dst_dir, relpath), File.read(f))
  end
end

def emit_skills(cfg)
  return unless cfg["receives_skills"]

  dst_root = File.join(ROOT, cfg["skills_dir"])

  Dir.glob(File.join(SKILLS_SRC, "*")).sort.each do |dir|
    next unless File.directory?(dir)

    name = File.basename(dir)
    next if TACTICAL_PACKS.include?(name)

    skill = File.join(dir, "SKILL.md")
    next unless File.exist?(skill)

    if skill_needs_full_tree?(dir)
      emit_skill_tree(dir, File.join(dst_root, name))
    else
      write_file(File.join(dst_root, name, "SKILL.md"), File.read(skill))
    end
  end

  TACTICAL_PACKS.each do |pack|
    pack_src = File.join(SKILLS_SRC, pack)
    next unless File.directory?(pack_src)

    Dir.glob(File.join(pack_src, "**", "*")).sort.each do |f|
      next unless File.file?(f)

      relpath = f.sub(SKILLS_SRC + File::SEPARATOR, "")
      write_file(File.join(dst_root, relpath), File.read(f))
    end
  end
end

# Claude consume commands/agents como markdown: copia verbatim de .cursor/.
# Gateado por flags explícitas para NO pisar los workflows de Antigravity
# (que genera sync-commands-from-meta) ni el origen de Cursor.
def emit_commands(cfg)
  return unless cfg["mirror_commands"] && cfg["commands_dir"] && Dir.exist?(COMMANDS_SRC)

  dst = File.join(ROOT, cfg["commands_dir"])
  Dir.glob(File.join(COMMANDS_SRC, "*.md")).sort.each do |f|
    write_file(File.join(dst, File.basename(f)), File.read(f))
  end
end

def emit_agents(cfg)
  return unless cfg["mirror_agents"] && cfg["agents_dir"] && Dir.exist?(AGENTS_SRC)

  dst = File.join(ROOT, cfg["agents_dir"])
  Dir.glob(File.join(AGENTS_SRC, "*.md")).sort.each do |f|
    write_file(File.join(dst, File.basename(f)), File.read(f))
  end
end

def claude_pointer
  <<~MD
    # CLAUDE.md

    > Puntero generado por `scripts/sync-ide`. No editar a mano.

    Este proyecto usa **El DT**. La fuente canónica de instrucciones para agentes es
    **[AGENTS.md](AGENTS.md)** — leelo primero.

    ## Específicos de Claude Code

    - Reglas: `.claude/rules/`
    - Commands: `.claude/commands/`
    - Skills: `.claude/skills/`
    - Subagentes: `.claude/agents/`
    - Settings: `.claude/settings.json`

    Reglas, skills y commands se **generan** desde fuentes únicas
    (`vitals/specs/rule-bodies/`, `vitals/config/`, `.cursor/skills/`, `.cursor/commands/`).
    No edites los destinos a mano: corré `./scripts/sync-ide.sh`.
  MD
end

def copilot_pointer
  <<~MD
    # GitHub Copilot — instrucciones del proyecto

    > Puntero generado por `scripts/sync-ide`. No editar a mano.

    Este proyecto usa **El DT**. Seguí las instrucciones canónicas en **[AGENTS.md](../AGENTS.md)**
    (raíz del repo). Resumen operativo:

    - **Ritual:** `/actualizar` → `/yo` → trabajar → `/guardar`.
    - **Protocolos DT:** ordenar, no cómplice, alternativas, puntos ciegos y **orden continuo**
      (loop autónomo que verifica con `dt-doctor` y corrige hasta dejar el orden en verde).
    - **Documentación:** protocolo en `docs/99_meta/protocolo-documentacion-ia.md`.
    - **Seguridad:** nunca commitear secretos; operaciones irreversibles requieren confirmación.
  MD
end

def generic_pointer(points_to)
  <<~MD
    > Puntero generado por `scripts/sync-ide`. No editar a mano.

    Este proyecto usa **El DT**. Instrucciones canónicas en **#{points_to}** (raíz del repo).
  MD
end

def emit_pointer(cfg)
  pointer = cfg["pointer"]
  return unless pointer && pointer["mode"] == "generate"

  file = File.join(ROOT, pointer["file"])
  content =
    case pointer["file"]
    when "CLAUDE.md" then claude_pointer
    when ".github/copilot-instructions.md" then copilot_pointer
    else generic_pointer(pointer["points_to"] || "AGENTS.md")
    end
  write_file(file, content)
end

def emit_settings(cfg)
  return unless cfg["settings"]

  content = <<~JSON
    {
      "_generated_by": "scripts/sync-ide",
      "_note": "El DT — entrada canónica en AGENTS.md; reglas en .claude/rules/, skills en .claude/skills/, commands en .claude/commands/."
    }
  JSON
  write_file(File.join(ROOT, cfg["settings"]), content)
end

# --- run ---
TARGETS.each do |name, cfg|
  next unless cfg["enabled"]

  puts "→ target: #{name} (#{cfg['label']})"
  emit_rules(cfg)
  emit_skills(cfg)
  emit_commands(cfg)
  emit_agents(cfg)
  emit_pointer(cfg)
  emit_settings(cfg)
end

if CHECK_ONLY && !@drift.empty?
  warn "sync-ide drift: #{@drift.size} archivo(s). Corré ./scripts/sync-ide.sh"
  exit 1
end

puts "sync-ide: #{CHECK_ONLY ? 'check OK (sin drift)' : "#{@written} archivo(s) emitidos"}."
