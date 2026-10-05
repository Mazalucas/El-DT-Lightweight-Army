#!/usr/bin/env ruby
# frozen_string_literal: true
# Contrato de skills: frontmatter, commands-meta y freno de Google Cloud.
# Exit 1 si hay errores. Los WARN no fallan.

require "yaml"

ROOT = File.expand_path("..", __dir__)
SRC = File.join(ROOT, ".cursor/skills")
STOP = "No recorras Google Cloud Console."
GOOGLE = %w[dt-drive dt-gmail dt-calendar].freeze
FORBIDDEN = [
  "Crear credenciales",
  "Authorized redirect",
  "oauth-callback",
  "Gmail MCP API",
  "DOC-OPS-002",
  "clientSecret",
  "drive-google-cloud-admin.md"
].freeze
SPEC_FORBIDDEN = [
  "oauth-callback",
  "Authorized redirect",
  "clientSecret",
  "DOC-OPS-002",
  "drive-google-cloud-admin.md"
].freeze

errors = []
warns = []

def frontmatter(text)
  return nil unless text.start_with?("---")

  parts = text.split(/^---\s*$/, 3)
  return nil if parts.length < 3

  YAML.safe_load(parts[1])
rescue StandardError
  nil
end

meta_path = File.join(ROOT, "vitals/config/commands-meta.yaml")
meta = YAML.safe_load(File.read(meta_path), permitted_classes: [])
commands = meta.is_a?(Hash) ? meta["commands"] : nil
unless commands.is_a?(Hash)
  errors << "commands-meta.yaml sin commands"
  commands = {}
end

commands.each do |cmd, cfg|
  next unless cfg.is_a?(Hash)

  skill = cfg["skill"]
  next if skill.nil? || skill.to_s.strip.empty?

  path = File.join(SRC, skill, "SKILL.md")
  errors << "/#{cmd} apunta a skill '#{skill}' y no existe #{path.sub(ROOT + "/", "")}" unless File.exist?(path)
end

standard = File.join(ROOT, "vitals/specs/skill-standard.md")
errors << "falta vitals/specs/skill-standard.md" unless File.exist?(standard)

spec = File.join(ROOT, "vitals/specs/google-apps-mcp.md")
if File.exist?(spec)
  body = File.read(spec)
  errors << "google-apps-mcp.md no incluye el freno «#{STOP}»" unless body.include?(STOP)
  SPEC_FORBIDDEN.each do |phrase|
    errors << "google-apps-mcp.md no debe incluir «#{phrase}» (eso filtra el alta de Cloud al chat)" if body.include?(phrase)
  end
else
  errors << "falta vitals/specs/google-apps-mcp.md"
end

Dir.glob(File.join(SRC, "**", "SKILL.md")).sort.each do |path|
  rel = path.sub(ROOT + "/", "")
  folder = File.basename(File.dirname(path))
  text = File.read(path)
  data = frontmatter(text)
  unless data.is_a?(Hash) && data["name"].to_s != "" && data["description"].to_s != ""
    errors << "#{rel}: frontmatter sin name y description"
    next
  end
  errors << "#{rel}: name '#{data["name"]}' distinto de la carpeta '#{folder}'" if data["name"] != folder
  warns << "#{rel}: description sin 'Use when'" unless data["description"].include?("Use when")

  next unless GOOGLE.include?(folder)

  errors << "#{rel}: falta la frase «#{STOP}»" unless text.include?(STOP)
  FORBIDDEN.each do |phrase|
    errors << "#{rel}: no dictar «#{phrase}» (eso es el runbook de IT, fuera de este chat)" if text.include?(phrase)
  end
end

warns.each { |w| warn "WARN #{w}" }
if errors.empty?
  puts "audit-skills: OK (#{Dir.glob(File.join(SRC, "**", "SKILL.md")).size} skills)"
  exit 0
end

errors.each { |e| warn "ERROR #{e}" }
exit 1
