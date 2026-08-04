#!/usr/bin/env ruby
# frozen_string_literal: true

# Sincroniza commands en Cursor y Antigravity desde vitals/config/commands-meta.yaml
# Una definición en YAML → .cursor/commands/{cmd}.md + .agents/workflows/{cmd}.md
# Uso: ruby scripts/sync-commands-from-meta.rb [--check]

require "yaml"
require "fileutils"

ROOT = File.expand_path("..", __dir__)
META_PATH = File.join(ROOT, "vitals/config/commands-meta.yaml")
CHECK_ONLY = ARGV.include?("--check")

meta = YAML.load_file(META_PATH)
groups = meta["groups"] || {}
commands = meta["commands"] || {}

def group_title(groups, group_key)
  g = groups[group_key]
  g.is_a?(Hash) ? g["title"].to_s : group_key.to_s
end

def strip_frontmatter(text)
  return text unless text.start_with?("---\n")

  rest = text.sub(/\A---\n.*?\n---\n/m, "")
  rest.start_with?("\n") ? rest[1..] : rest
end

def cursor_frontmatter(cmd, cfg, groups)
  gkey = cfg["group"]
  gtitle = group_title(groups, gkey)
  lines = [
    "---",
    "dt_command: #{cmd}",
    "group: #{gkey}",
    "group_title: \"#{gtitle}\"",
    "tagline: \"#{cfg['tagline']}\""
  ]
  lines << "skill: #{cfg['skill']}" if cfg["skill"]
  lines << "---"
  lines.join("\n") + "\n\n"
end

def agent_frontmatter(cmd, cfg, groups)
  gkey = cfg["group"]
  gtitle = group_title(groups, gkey)
  prefix = gkey == "routine" ? "[Rutina]" : "[#{gtitle}]"
  <<~YAML
    ---
    description: "#{prefix} #{cfg['tagline']}"
    dt_command: #{cmd}
    ---
  YAML
end

def skill_command_body(cmd, cfg, groups)
  gkey = cfg["group"]
  gtitle = group_title(groups, gkey)
  skill = cfg["skill"]
  <<~MD
    # /#{cmd}

    **Grupo:** #{gtitle}
    **En una frase:** #{cfg['tagline']}
    **Cuándo:** #{cfg['when']}
    **Quién:** Cualquier operador del repo.

    Ejecutá el skill **`#{skill}`** — `.cursor/skills/#{skill}/` y `.agents/skills/#{skill}/`.
    #{agent_activation(cfg)}
    _Generado desde `vitals/config/commands-meta.yaml` — corré `scripts/sync-commands-from-meta.sh`._
  MD
end

# Solo los commands que declaran `agent:` proponen delegar en un subagente.
# Sin esta cláusula, rutinas como /guardar invitarían a delegar escrituras Git.
def agent_activation(cfg)
  agent = cfg["agent"]
  return "" unless agent

  "\nDelegá en el subagente **`#{agent}`** (`.cursor/agents/#{agent}.md`) vía Task " \
    "(`subagent_type: #{agent}`) con el alcance del usuario. Si el IDE no expone subagentes " \
    "(Antigravity, Codex), ejecutá el pipeline de la skill en esta conversación.\n"
end

def canonical_body(cmd, cfg)
  rel = cfg["command_path"] || cfg["workflow_path"]
  unless rel
    warn "Command #{cmd}: falta command_path o workflow_path"
    return nil
  end
  path = File.join(ROOT, rel)
  unless File.exist?(path)
    warn "Missing canonical: #{path}"
    return nil
  end
  strip_frontmatter(File.read(path))
end

drift = []

commands.each_key do |cmd|
  cfg = commands[cmd]
  cursor_path = File.join(ROOT, ".cursor/commands/#{cmd}.md")
  workflow_path = File.join(ROOT, ".agents/workflows/#{cmd}.md")

  if cfg["skill"]
    expected_cursor = cursor_frontmatter(cmd, cfg, groups) + skill_command_body(cmd, cfg, groups)
    expected_workflow = agent_frontmatter(cmd, cfg, groups) + skill_command_body(cmd, cfg, groups)
  else
    body = canonical_body(cmd, cfg)
    next unless body

    expected_cursor = cursor_frontmatter(cmd, cfg, groups) + body
    expected_workflow = agent_frontmatter(cmd, cfg, groups) + body
  end

  [[cursor_path, expected_cursor], [workflow_path, expected_workflow]].each do |path, expected|
    if File.exist?(path) && File.read(path) == expected
      puts "OK #{path}"
      next
    end

    drift << path
    unless CHECK_ONLY
      FileUtils.mkdir_p(File.dirname(path))
      File.write(path, expected)
      puts "Updated #{path}"
    else
      puts "DRIFT #{path}"
    end
  end
end

if CHECK_ONLY && !drift.empty?
  warn "commands-meta drift: #{drift.size} file(s). Run ./scripts/sync-commands-from-meta.sh"
  exit 1
end

puts "sync-commands-from-meta: #{commands.size} commands → Cursor + Antigravity."
