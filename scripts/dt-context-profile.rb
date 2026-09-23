#!/usr/bin/env ruby
# frozen_string_literal: true

# Perfil local de contexto (/dt-config).
# No escribe sesión ni roster. El YAML y la regla 99-perfil-local no van a Git.
#
#   ruby scripts/dt-context-profile.rb panel
#   ruby scripts/dt-context-profile.rb text
#   ruby scripts/dt-context-profile.rb show
#   ruby scripts/dt-context-profile.rb apply --phrase "Docs"
#   ruby scripts/dt-context-profile.rb self-check

require "fileutils"
require "json"
require "time"
require "yaml"

ROOT = File.expand_path("..", __dir__)
PROFILE = File.join(ROOT, "vitals/ops/context-profile.yaml")
BODY_DIR = File.join(ROOT, "vitals/specs/rule-bodies")
MANIFEST = YAML.load_file(File.join(ROOT, "vitals/config/rules-manifest.yaml"))["rules"] || []
LOCAL_STEM = "99-perfil-local"

LOCKED = [
  { "title" => "Personalidad", "note" => "Ordena, cuestiona y deja memoria. Sin esto deja de trabajar como DT." },
  { "title" => "Protocolos", "note" => "Antes de ejecutar pregunta, ofrece dos caminos y marca riesgos." },
  { "title" => "Especialistas", "note" => "Sabe a quién pasar backend, docs, QA, diseño o marketing." },
  { "title" => "Equipo", "note" => "Pide /yo y frena publicar el repo oficial si este checkout no puede." }
].freeze

CHOICES = [
  { "id" => "docs", "stem" => "02-documentacion", "title" => "Documentación", "note" => "Al escribir en docs, usa capas, IDs y el catálogo." },
  { "id" => "orden", "stem" => "07-orden-continuo", "title" => "Orden", "note" => "Después de tocar reglas o docs, corre una revisión del framework." },
  { "id" => "reuse", "stem" => "15-engineering-reuse", "title" => "Reutilizar código", "note" => "Busca lo que ya existe antes de crear archivos nuevos." },
  { "id" => "web", "stem" => "08-stack-web-default", "title" => "Stack web", "note" => "En una app o API, parte de Node y Firebase." },
  { "id" => "frontend", "stem" => "20-frontend-ui", "title" => "Frontend", "note" => "Componentes, estado y accesibilidad en la interfaz." },
  { "id" => "backend", "stem" => "10-arquitectura-backend", "title" => "Backend", "note" => "Cómo se arman APIs, capas y errores." },
  { "id" => "numeros", "stem" => "16-numeric-grounding", "title" => "Números", "note" => "Los totales salen de un script, con la fuente a la vista." },
  { "id" => "tests", "stem" => "30-testing", "title" => "Tests", "note" => "Qué cubrir y cómo armar los mocks." },
  { "id" => "devops", "stem" => "40-devops", "title" => "DevOps", "note" => "CI, Docker y deploy." },
  { "id" => "secretos", "stem" => "90-seguridad-secrets", "title" => "Secretos", "note" => "No guardar claves en el repo. Se activa sola al tocar .env o credenciales." },
  { "id" => "canvas", "stem" => "17-canvas-first", "title" => "Canvas", "note" => "Planes y auditorías grandes van a un panel al lado del chat." },
  { "id" => "repos", "stem" => "05-multi-project-git", "title" => "Varios repos", "note" => "Antes de un commit, confirma en qué proyecto estás." },
  { "id" => "drive", "stem" => "18-drive-contexto", "title" => "Drive", "note" => "Consulta solo las carpetas de Drive que registraste, sin modificarlas." }
].freeze

PRESETS = [
  { "id" => "recomendado", "label" => "Usar recomendado", "phrase" => "Recomendado", "ids" => [] },
  { "id" => "docs", "label" => "Trabajar en docs", "phrase" => "Docs", "ids" => %w[docs orden] },
  { "id" => "codigo", "label" => "Trabajar en código", "phrase" => "Código", "ids" => %w[reuse] },
  { "id" => "web", "label" => "Trabajar en web", "phrase" => "Web", "ids" => %w[web frontend backend reuse] },
  { "id" => "numeros", "label" => "Trabajar en números", "phrase" => "Números", "ids" => %w[numeros] }
].freeze

ALIASES = {
  "usar recomendado" => "Recomendado",
  "trabajar en docs" => "Docs",
  "trabajar en codigo" => "Código",
  "trabajar en web" => "Web",
  "trabajar en numeros" => "Números"
}.freeze

class ParseError < StandardError; end

def fold(text)
  text.to_s.unicode_normalize(:nfd).gsub(/\p{Mn}/, "").downcase.strip
end

def h(text)
  text.to_s.gsub("&", "&amp;").gsub("<", "&lt;").gsub(">", "&gt;").gsub('"', "&quot;")
end

def join_es(items)
  return "" if items.empty?
  return items[0] if items.length == 1
  return "#{items[0]} y #{items[1]}" if items.length == 2

  "#{items[0..-2].join(', ')} y #{items[-1]}"
end

def finish(preset, phrase, ids)
  ordered = CHOICES.map { |choice| choice["id"] }.select { |id| ids.include?(id) }
  stems = CHOICES.select { |choice| ordered.include?(choice["id"]) }.map { |choice| choice["stem"] }
  { "preset" => preset, "phrase" => phrase, "ids" => ordered, "stems" => stems }
end

def split_labels(folded)
  if folded.include?(" y ")
    head, _sep, tail = folded.rpartition(" y ")
    parts = head.split(",").map(&:strip).reject(&:empty?)
    parts << tail.strip
    parts.reject(&:empty?)
  else
    folded.split(",").map(&:strip).reject(&:empty?)
  end
end

def choice_id_for_label(folded_label)
  choice = CHOICES.find { |item| fold(item["title"]) == folded_label }
  return choice["id"] if choice

  known = CHOICES.map { |item| item["title"] }.join(", ")
  raise ParseError, "No reconozco «#{folded_label}». Podés nombrar: #{known}."
end

def parse_phrase(raw)
  cleaned = raw.to_s.strip.sub(/[.。]\z/, "")
  raise ParseError, "Falta la frase del perfil." if cleaned.empty?

  canonical = ALIASES[fold(cleaned)] || cleaned
  folded = fold(canonical)
  preset = PRESETS.find { |item| fold(item["phrase"]) == folded }
  return finish(preset["id"], preset["phrase"], preset["ids"]) if preset

  matched = folded.match(/\Arecomendado, y (.+) en siempre\z/)
  raise ParseError, "No entendí «#{cleaned}». Respondé Recomendado, Docs, Código, Web o Números." unless matched

  ids = split_labels(matched[1]).map { |label| choice_id_for_label(label) }
  ids = ids.uniq
  found = PRESETS.find { |item| item["ids"].sort == ids.sort }
  return finish(found["id"], found["phrase"], found["ids"]) if found

  titles = CHOICES.select { |choice| ids.include?(choice["id"]) }.map { |choice| choice["title"] }
  if titles.empty?
    finish("recomendado", "Recomendado", [])
  else
    finish("custom", "Recomendado, y #{join_es(titles)} en siempre", ids)
  end
end

def read_profile
  return nil unless File.exist?(PROFILE)

  data = YAML.safe_load(File.read(PROFILE), permitted_classes: [])
  data.is_a?(Hash) ? data : nil
end

def current_resolved
  data = read_profile
  return finish("recomendado", "Recomendado", []) unless data

  preset_id = data["preset"].to_s
  known = PRESETS.find { |item| item["id"] == preset_id }
  return finish(known["id"], known["phrase"], known["ids"]) if known

  stems = Array(data["siempre"]).map(&:to_s)
  ids = CHOICES.select { |choice| stems.include?(choice["stem"]) }.map { |choice| choice["id"] }
  phrase = data["phrase"].to_s
  phrase = "Recomendado" if phrase.empty?
  finish("custom", phrase, ids)
end

def rule_paths
  targets = YAML.load_file(File.join(ROOT, "vitals/config/ide-targets.yaml"))["targets"] || {}
  paths = []
  targets.each_value do |cfg|
    next unless cfg["enabled"]

    rules = cfg["rules"]
    next unless rules.is_a?(Hash) && rules["dir"] && rules["ext"]

    paths << File.join(ROOT, rules["dir"], "#{LOCAL_STEM}#{rules['ext']}")
  end
  paths.uniq
end

def rule_document(stems)
  chunks = [<<~MD]
    ---
    description: Perfil local de contexto. Reglas extra siempre activas en esta máquina.
    alwaysApply: true
    ---

    # Perfil local de contexto

    Lo genera `/dt-config`. No editar a mano. No va a Git.

    Estas reglas van en cada mensaje, además de personalidad, protocolos, especialistas y equipo.
  MD
  stems.each do |stem|
    body = File.read(File.join(BODY_DIR, "#{stem}.body.md")).rstrip
    chunks << "#{body}\n"
  end
  "#{chunks.join("\n").rstrip}\n"
end

def remove_local_rules
  rule_paths.each { |path| File.delete(path) if File.exist?(path) }
end

def write_profile(resolved)
  FileUtils.mkdir_p(File.dirname(PROFILE))
  lines = [
    "version: 1",
    "updated: \"#{Time.now.iso8601}\"",
    "preset: #{resolved['preset']}",
    "phrase: #{resolved['phrase'].inspect}"
  ]
  if resolved["stems"].empty?
    lines << "siempre: []"
  else
    lines << "siempre:"
    resolved["stems"].each { |stem| lines << "  - #{stem}" }
  end
  File.write(PROFILE, "#{lines.join("\n")}\n")
end

def stems_with_globs(stems)
  stems.select do |stem|
    meta = MANIFEST.find { |rule| rule["stem"] == stem }
    meta && meta["globs"]
  end
end

def summary(resolved)
  lines = ["Perfil: #{resolved['phrase']}"]
  if resolved["stems"].empty?
    lines << "En cada mensaje: personalidad, protocolos, especialistas y equipo."
    lines << "El resto entra cuando el tema aparece."
  else
    titles = CHOICES.select { |choice| resolved["ids"].include?(choice["id"]) }.map { |choice| choice["title"] }
    lines << "También en cada mensaje: #{join_es(titles)}."
    lines << "Lo demás entra cuando el tema aparece."
    unless stems_with_globs(resolved["stems"]).empty?
      lines << "Si abrís archivos de ese tema, esa regla puede cargarse dos veces."
    end
  end
  lines << "Guardado solo en esta PC (no va a Git)."
  lines.join("\n")
end

def apply_resolved(resolved)
  write_profile(resolved)
  if resolved["stems"].empty?
    remove_local_rules
  else
    document = rule_document(resolved["stems"])
    rule_paths.each do |path|
      FileUtils.mkdir_p(File.dirname(path))
      File.write(path, document)
    end
  end
  summary(resolved)
end

def panel_html(resolved)
  active = resolved["ids"]
  pressed = resolved["preset"]
  buttons = PRESETS.map do |preset|
    on = preset["id"] == pressed
    %(    <button type="button" class="vis-btn vis-btn-tile" data-preset="#{h(preset['id'])}" aria-pressed="#{on ? 'true' : 'false'}">#{h(preset['label'])}</button>)
  end.join("\n")

  locked = LOCKED.map do |item|
    <<~HTML
      <div class="rule">
        <div class="rule-copy">
          <strong>#{h(item['title'])}</strong>
          <span class="rule-note vis-text-small vis-text-muted">#{h(item['note'])}</span>
        </div>
        <span class="vis-badge vis-accent">No se apaga</span>
      </div>
    HTML
  end.join("<hr>\n")

  choices = CHOICES.map do |choice|
    on = active.include?(choice["id"])
    badge = on ? "vis-badge vis-warn" : "vis-badge"
    badge_text = on ? "Siempre" : "Cuando haga falta"
    checked = on ? " checked" : ""
    <<~HTML
      <div class="rule">
        <div class="rule-copy">
          <strong>#{h(choice['title'])}</strong>
          <span class="rule-note vis-text-small vis-text-muted">#{h(choice['note'])}</span>
        </div>
        <span class="#{badge}" id="badge-#{h(choice['id'])}">#{badge_text}</span>
        <div class="vis-form-item">
          <input id="rule-#{h(choice['id'])}" class="vis-switch" type="checkbox" data-rule="#{h(choice['id'])}" data-label="#{h(choice['title'])}"#{checked}>
          <label for="rule-#{h(choice['id'])}">En cada mensaje</label>
        </div>
      </div>
    HTML
  end.join("<hr>\n")

  js_presets = {}
  js_phrases = {}
  PRESETS.each do |preset|
    js_presets[preset["id"]] = preset["ids"]
    js_phrases[preset["id"]] = preset["phrase"]
  end

  <<~HTML
    <div id="dt-config-panel" class="vis-section-stack">
      <p class="vis-sr-only">Panel para elegir cuánto contexto del DT queda activo. Las cuatro primeras reglas no se apagan. El resto entra cuando el tema aparece, salvo que elijas un perfil de trabajo.</p>
      <div class="vis-column">
        <h2>Cuánto contexto querés activo</h2>
        <p>Elegí un perfil. La frase de abajo es tu respuesta: con eso queda configurado.</p>
      </div>
      <div class="vis-row" role="group" aria-label="Perfil">
    #{buttons}
      </div>
      <p class="vis-text-muted">El perfil prende las reglas de ese trabajo en cada mensaje. El resto sigue entrando solo cuando hace falta.</p>
      <div class="vis-row" aria-label="Significado de cada estado">
        <span class="vis-badge vis-accent">No se apaga</span>
        <span class="vis-text-small">Va en cada mensaje. El DT la necesita.</span>
        <span class="vis-badge">Cuando haga falta</span>
        <span class="vis-text-small">Recomendado. Entra si el tema aparece.</span>
        <span class="vis-badge vis-warn">Siempre</span>
        <span class="vis-text-small">También entra cuando hablás de otra cosa.</span>
      </div>
      <h2>No se apaga</h2>
      <div class="vis-column">
    #{locked}
      </div>
      <h2>Según tu trabajo</h2>
      <div class="vis-column" id="dt-config-choices">
    #{choices}
      </div>
      <div class="vis-alert" id="dt-config-reply">
        <span>Para configurarlo, respondé</span>
        <strong id="dt-config-phrase">#{h(resolved['phrase'])}</strong>
      </div>
    </div>
    <style>
      #dt-config-panel .rule {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 8px 16px;
      }
      #dt-config-panel .rule-copy {
        flex: 1 1 220px;
        min-width: 0;
      }
      #dt-config-panel .rule-note {
        display: block;
      }
    </style>
    <script>
      (function () {
        var root = document.getElementById("dt-config-panel");
        var presets = #{JSON.generate(js_presets)};
        var phrases = #{JSON.generate(js_phrases)};

        function joinEs(items) {
          if (items.length === 0) return "";
          if (items.length === 1) return items[0];
          if (items.length === 2) return items[0] + " y " + items[1];
          return items.slice(0, -1).join(", ") + " y " + items[items.length - 1];
        }

        function syncBadges() {
          root.querySelectorAll("[data-rule]").forEach(function (input) {
            var badge = document.getElementById("badge-" + input.getAttribute("data-rule"));
            if (input.checked) {
              badge.textContent = "Siempre";
              badge.className = "vis-badge vis-warn";
            } else {
              badge.textContent = "Cuando haga falta";
              badge.className = "vis-badge";
            }
          });
        }

        function phraseFor(preset) {
          if (preset !== "custom") return phrases[preset];
          var picked = [];
          root.querySelectorAll("[data-rule]").forEach(function (input) {
            if (input.checked) picked.push(input.getAttribute("data-label"));
          });
          if (picked.length === 0) return "Recomendado";
          return "Recomendado, y " + joinEs(picked) + " en siempre";
        }

        function markPreset(preset) {
          root.querySelectorAll("[data-preset]").forEach(function (btn) {
            btn.setAttribute("aria-pressed", btn.getAttribute("data-preset") === preset ? "true" : "false");
          });
        }

        function apply(preset) {
          var on = presets[preset] || [];
          root.querySelectorAll("[data-rule]").forEach(function (input) {
            input.checked = on.indexOf(input.getAttribute("data-rule")) !== -1;
          });
          markPreset(preset);
          syncBadges();
          document.getElementById("dt-config-phrase").textContent = phraseFor(preset);
        }

        root.querySelectorAll("[data-preset]").forEach(function (btn) {
          btn.addEventListener("click", function () {
            apply(btn.getAttribute("data-preset"));
          });
        });

        root.querySelectorAll("[data-rule]").forEach(function (input) {
          input.addEventListener("change", function () {
            markPreset("custom");
            syncBadges();
            document.getElementById("dt-config-phrase").textContent = phraseFor("custom");
          });
        });
      })();
    </script>
  HTML
end

def text_panel(resolved)
  lines = []
  lines << "Ahora: #{resolved['phrase']}" unless read_profile.nil?
  lines << "Cuánto contexto querés activo"
  lines << ""
  lines << "No se apaga:"
  LOCKED.each { |item| lines << "- #{item['title']} — #{item['note']}" }
  lines << ""
  lines << "Respondé con una palabra:"
  PRESETS.each do |preset|
    if preset["ids"].empty?
      lines << "- #{preset['phrase']} — el resto entra cuando hace falta"
    else
      titles = CHOICES.select { |choice| preset["ids"].include?(choice["id"]) }.map { |choice| choice["title"] }
      lines << "- #{preset['phrase']} — #{join_es(titles)} en cada mensaje"
    end
  end
  lines << ""
  lines << "O armá la frase: Recomendado, y Documentación en siempre"
  lines << ""
  lines << "Según tu trabajo:"
  CHOICES.each do |choice|
    state = resolved["ids"].include?(choice["id"]) ? "Siempre" : "Cuando haga falta"
    lines << "- #{choice['title']} (#{state}) — #{choice['note']}"
  end
  lines.join("\n")
end

def self_check
  errors = []
  CHOICES.each do |choice|
    body = File.join(BODY_DIR, "#{choice['stem']}.body.md")
    errors << "falta cuerpo #{choice['stem']}" unless File.exist?(body)
    meta = MANIFEST.find { |rule| rule["stem"] == choice["stem"] }
    errors << "falta en el manifiesto #{choice['stem']}" unless meta
    errors << "#{choice['stem']} ya es alwaysApply" if meta && meta["alwaysApply"] == true
  end
  PRESETS.each do |preset|
    preset["ids"].each do |id|
      errors << "preset #{preset['id']} usa id desconocido #{id}" unless CHOICES.any? { |choice| choice["id"] == id }
    end
  end

  checks = {
    "Recomendado" => [],
    "Docs" => %w[02-documentacion 07-orden-continuo],
    "Código" => %w[15-engineering-reuse],
    "codigo" => %w[15-engineering-reuse],
    "Web" => %w[15-engineering-reuse 08-stack-web-default 20-frontend-ui 10-arquitectura-backend],
    "Números" => %w[16-numeric-grounding],
    "Trabajar en docs" => %w[02-documentacion 07-orden-continuo],
    "Recomendado, y Documentación en siempre" => %w[02-documentacion],
    "Recomendado, y Documentación y Orden en siempre" => %w[02-documentacion 07-orden-continuo],
    "Recomendado, y Documentación, Orden y Números en siempre" => %w[02-documentacion 07-orden-continuo 16-numeric-grounding]
  }
  checks.each do |phrase, stems|
    got = parse_phrase(phrase)["stems"]
    errors << "«#{phrase}» dio #{got.inspect}, esperaba #{stems.inspect}" unless got == stems
  end

  begin
    parse_phrase("Nope")
    errors << "Nope debería fallar"
  rescue ParseError
    nil
  end

  html = panel_html(finish("recomendado", "Recomendado", []))
  errors << "el panel no es un fragmento" if html.include?("<html") || html.include?("<!doctype")
  ["Usar recomendado", "No se apaga", "Documentación", "Reutilizar código", "Trabajar en web"].each do |needle|
    errors << "el panel no muestra #{needle}" unless html.include?(needle)
  end

  unless errors.empty?
    warn errors.join("\n")
    exit 1
  end

  puts "dt-context-profile self-check OK"
end

def usage
  <<~TXT
    Uso:
      ruby scripts/dt-context-profile.rb panel
      ruby scripts/dt-context-profile.rb text
      ruby scripts/dt-context-profile.rb show
      ruby scripts/dt-context-profile.rb apply --phrase "Docs"
      ruby scripts/dt-context-profile.rb self-check
  TXT
end

command = ARGV.shift
case command
when "panel"
  $stdout.write(panel_html(current_resolved))
when "text"
  puts text_panel(current_resolved)
when "show"
  if read_profile.nil?
    puts "Todavía no elegiste. El equipo usa Recomendado: las cuatro fijas en cada mensaje, el resto cuando hace falta."
  else
    puts summary(current_resolved)
  end
when "apply"
  if ARGV.include?("--phrase")
    index = ARGV.index("--phrase")
    value = ARGV[index + 1]
    abort "Falta el texto después de --phrase" if value.nil? || value.start_with?("--")
    begin
      puts apply_resolved(parse_phrase(value))
    rescue ParseError => e
      warn e.message
      exit 2
    end
  else
    warn "apply necesita --phrase"
    warn usage
    exit 1
  end
when "self-check"
  self_check
else
  warn usage
  exit 1
end
