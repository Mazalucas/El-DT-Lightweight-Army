#!/usr/bin/env ruby
# frozen_string_literal: true

# dt-agent — operaciones de miembros e inbox (contrato: vitals/specs/agent-inbox.md).
# Hace cumplir el contrato: alta pending, solo el owner activa, solo el dueño cambia estado,
# sin duplicados, tope de pendientes por remitente y de hilo.
#
# Identidad: --as <id>  >  $DT_AGENT_ID  >  vitals/ops/session.yaml
#
# Uso:
#   dt-agent whoami
#   dt-agent register --id ID --name N --owner HUMANO --runtime R --scope "S"
#   dt-agent login                         # /yo modo agente: escribe session.yaml si está active
#   dt-agent activate|pause|retire ID      # solo el owner humano del agente
#   dt-agent members [--all]
#   dt-agent inbox [--all] [--team]
#   dt-agent send --to ID --type T --slug S (--text "..." | --file F) [--reply-to ARCH] [--expires FECHA] [--refs a,b]
#   dt-agent claim|done|decline ARCH [--note "..."]
#   dt-agent cancel ARCH --note "..."      # remitente desestima un pedido suyo
#   dt-agent archive                       # mueve done/declined a archive/

require_relative "lib/force_utf8"
require "yaml"
require "time"
require "fileutils"
require "optparse"

ROOT = File.expand_path("..", __dir__)
ROSTER = File.join(ROOT, "vitals/config/roster.yaml")
SESSION = File.join(ROOT, "vitals/ops/session.yaml")
INBOX = File.join(ROOT, "vitals/work/inbox")
CANONICAL = File.join(ROOT, "vitals/ops/canonical-checkout.yaml")

TYPES = %w[request handoff question fyi cancel].freeze
CLOSED = %w[done declined].freeze
MAX_THREAD = 5
MAX_PENDING_PER_SENDER = 3

def die(msg, code = 1)
  warn "dt-agent: #{msg}"
  exit code
end

def now
  Time.now.iso8601
end

def roster
  return [] unless File.exist?(ROSTER)

  (YAML.safe_load(File.read(ROSTER), permitted_classes: [Date, Time]) || {})["team"] || []
end

def member(id)
  roster.find { |m| m["id"].to_s == id.to_s }
end

def kind(m)
  (m && m["kind"]) || "human"
end

def can_receive?(m)
  m && (kind(m) == "human" || m["status"].to_s == "active")
end

def identity(opts)
  id = opts[:as] || ENV["DT_AGENT_ID"]
  if id.to_s.empty? && File.exist?(SESSION)
    id = ((YAML.safe_load(File.read(SESSION), permitted_classes: [Date, Time]) || {})["operator"] || {})["id"]
  end
  die("sin identidad: usá --as, DT_AGENT_ID o /yo") if id.to_s.empty?
  id.to_s
end

def guard_canonical!
  return unless File.exist?(CANONICAL)

  die("checkout oficial del DT: no hay altas ni inbox en Git (solo sesión local)", 3)
end

def frontmatter(path)
  text = File.read(path)
  return [nil, text] unless text.start_with?("---\n")

  close = text.index("\n---", 4)
  return [nil, text] unless close

  [YAML.safe_load(text[4...close], permitted_classes: [Date, Time]) || {}, text]
end

def messages(id = nil)
  pattern = id ? File.join(INBOX, id, "*.md") : File.join(INBOX, "*", "*.md")
  Dir.glob(pattern).map do |p|
    b = File.basename(p)
    next if b.start_with?("draft-") || b.casecmp("README.md").zero?

    fm, = frontmatter(p)
    fm ? [p, fm] : nil
  end.compact
end

def thread_depth(name, index)
  depth = 1
  seen = [name]
  parent = index.dig(name, "reply_to").to_s
  while !parent.empty? && index.key?(parent) && !seen.include?(parent)
    seen << parent
    depth += 1
    parent = index.dig(parent, "reply_to").to_s
  end
  depth
end

def find_message(arg)
  path = File.exist?(arg) ? File.expand_path(arg) : Dir.glob(File.join(INBOX, "*", arg)).first
  die("no encuentro el mensaje #{arg}") unless path && File.exist?(path)
  path
end

def set_status(path, status, actor, note)
  fm, text = frontmatter(path)
  die("#{path}: sin frontmatter") unless fm
  text = text.sub(/^status:.*$/, "status: #{status}")
  line = "- #{now} #{actor}: #{status}#{note.to_s.empty? ? '' : " — #{note}"}"
  text = text.include?("## Registro") ? "#{text.rstrip}\n#{line}\n" : "#{text.rstrip}\n\n## Registro\n\n#{line}\n"
  File.write(path, text)
end

def write_message(from:, to:, type:, slug:, body:, reply_to: nil, expires: nil, refs: [])
  dir = File.join(INBOX, to)
  FileUtils.mkdir_p(dir)
  stamp = Time.now.strftime("%Y%m%d-%H%M")
  safe = slug.downcase.gsub(/[^a-z0-9]+/, "-").gsub(/\A-|-\z/, "")
  path = File.join(dir, "#{stamp}-#{from}-#{safe}.md")
  die("ya existe #{path}") if File.exist?(path)
  fm = { "from" => from, "to" => to, "type" => type, "status" => "open", "created" => now }
  fm["reply_to"] = reply_to if reply_to
  fm["expires"] = expires if expires
  fm["refs"] = refs unless refs.empty?
  File.write(path, "#{fm.to_yaml}---\n\n#{body.strip}\n")
  path.sub("#{ROOT}/", "")
end

def append_roster(entry)
  text = File.read(ROSTER)
  block = entry.to_yaml.sub(/\A---\n/, "").lines.map.with_index { |l, i| (i.zero? ? "  - " : "    ") + l }.join
  text = text =~ /^team:\s*\[\]\s*$/ ? text.sub(/^team:\s*\[\]\s*$/, "team:\n#{block.rstrip}") : "#{text.rstrip}\n#{block}"
  text = text.sub(/^updated:.*$/, "updated: \"#{now}\"")
  File.write(ROSTER, text.end_with?("\n") ? text : "#{text}\n")
end

def set_member_status(id, status, actor)
  lines = File.read(ROSTER).lines
  start = lines.index { |l| l =~ /^\s*-\s*id:\s*["']?#{Regexp.escape(id)}["']?\s*$/ }
  die("#{id} no está en el roster") unless start
  finish = (start + 1...lines.size).find { |i| lines[i] =~ /^\s*-\s/ || lines[i] =~ /^\S/ } || lines.size
  idx = (start...finish).find { |i| lines[i] =~ /^\s+status:/ }
  die("#{id} no tiene status") unless idx
  indent = lines[idx][/^\s+/]
  lines[idx] = "#{indent}status: #{status}\n"
  { "status_by" => actor, "status_at" => now }.each do |key, value|
    at = (start...finish).find { |i| lines[i] =~ /^\s+#{key}:/ }
    row = "#{indent}#{key}: \"#{value}\"\n"
    if at
      lines[at] = row
    else
      lines.insert(idx + 1, row)
      finish += 1
    end
  end
  File.write(ROSTER, lines.join.sub(/^updated:.*$/, "updated: \"#{now}\""))
end

cmd = ARGV.shift
opts = { refs: [] }
OptionParser.new do |o|
  o.on("--as ID") { |v| opts[:as] = v }
  o.on("--id ID") { |v| opts[:id] = v }
  o.on("--name N") { |v| opts[:name] = v }
  o.on("--owner O") { |v| opts[:owner] = v }
  o.on("--runtime R") { |v| opts[:runtime] = v }
  o.on("--scope S") { |v| opts[:scope] = v }
  o.on("--to ID") { |v| opts[:to] = v }
  o.on("--type T") { |v| opts[:type] = v }
  o.on("--slug S") { |v| opts[:slug] = v }
  o.on("--text T") { |v| opts[:text] = v }
  o.on("--file F") { |v| opts[:file] = v }
  o.on("--reply-to A") { |v| opts[:reply_to] = v }
  o.on("--expires F") { |v| opts[:expires] = v }
  o.on("--refs L") { |v| opts[:refs] = v.split(",").map(&:strip) }
  o.on("--note N") { |v| opts[:note] = v }
  o.on("--all") { opts[:all] = true }
  o.on("--team") { opts[:team] = true }
end.parse!(ARGV)

case cmd
when "whoami"
  id = identity(opts)
  m = member(id)
  puts "id=#{id} kind=#{kind(m)} status=#{m ? (m['status'] || 'active') : 'no-registrado'}#{m && m['owner'] ? " owner=#{m['owner']}" : ''}"
  puts "inbox=vitals/work/inbox/#{id}/ abiertos=#{messages(id).count { |_, fm| fm['status'] == 'open' }}"

when "register"
  guard_canonical!
  %i[id name owner runtime scope].each { |k| die("falta --#{k}") if opts[k].to_s.strip.empty? }
  die("#{opts[:id]} ya está en el roster") if member(opts[:id])
  owner = member(opts[:owner])
  die("owner #{opts[:owner]} no es un humano del roster (primero /yo de una persona)") unless owner && kind(owner) == "human"
  append_roster("id" => opts[:id], "kind" => "agent", "name" => opts[:name], "owner" => opts[:owner],
                "runtime" => opts[:runtime], "scope" => opts[:scope], "status" => "pending", "registered_at" => now)
  msg = write_message(from: opts[:id], to: opts[:owner], type: "request", slug: "alta-#{opts[:id]}",
                      body: "## Pedido\n\nAlta de `#{opts[:id]}` como miembro agente.\n\n- Runtime: #{opts[:runtime]}\n- Scope: #{opts[:scope]}\n\nActivar: `./scripts/dt-agent.sh activate #{opts[:id]}`")
  puts "alta pending. Pedido al owner: #{msg}. Terminá la corrida hasta que el owner active."

when "login"
  id = identity(opts)
  m = member(id)
  die("#{id} no está en el roster: corré register", 2) unless m
  die("#{id} es humano: usá /yo", 2) unless kind(m) == "agent"
  die("#{id} está #{m['status']}: no trabaja hasta que el owner lo active", 2) unless m["status"] == "active"
  FileUtils.mkdir_p(File.dirname(SESSION))
  session = { "operator" => { "id" => id, "name" => m["name"].to_s, "kind" => "agent", "owner" => m["owner"].to_s,
                              "role" => "agent", "inbox_path" => "vitals/work/inbox/#{id}/" },
              "identified_at" => now, "session_started" => now }
  File.write(SESSION, session.to_yaml)
  FileUtils.mkdir_p(File.join(INBOX, id)) unless File.exist?(CANONICAL)
  puts "sesión agente #{id} (owner #{m['owner']}). Abiertos: #{messages(id).count { |_, fm| fm['status'] == 'open' }}"

when "activate", "pause", "retire"
  target = ARGV.shift or die("falta el id del agente")
  die("#{cmd} es solo para personas: DT_AGENT_ID está definida (modo agente). Pedíselo al owner", 5) unless ENV["DT_AGENT_ID"].to_s.empty?
  actor = identity(opts)
  m = member(target)
  die("#{target} no es un agente del roster") unless m && kind(m) == "agent"
  die("solo el owner (#{m['owner']}) puede cambiar el estado de #{target}") unless actor == m["owner"].to_s && kind(member(actor)) == "human"
  status = { "activate" => "active", "pause" => "paused", "retire" => "retired" }[cmd]
  set_member_status(target, status, actor)
  puts "#{target} → #{status}"
  warn "aviso: #{actor} no tiene email en el roster; dt-doctor no podrá verificar quién hizo este cambio. Agregalo (git config user.email)." if kind(member(actor)) == "human" && member(actor)["email"].to_s.strip.empty?

when "members"
  roster.each do |m|
    next unless opts[:all] || can_receive?(m)

    puts [m["id"], kind(m), m["status"] || "active", m["owner"], m["scope"]].compact.join(" | ")
  end

when "inbox"
  id = identity(opts)
  ids = [id]
  ids += roster.select { |m| m["owner"].to_s == id }.map { |m| m["id"] } if opts[:team]
  ids.each do |who|
    list = messages(who).reject { |_, fm| !opts[:all] && CLOSED.include?(fm["status"].to_s) }
    list.sort_by! { |p, _| File.basename(p) }
    puts "## #{who} (#{list.size})"
    list.each do |p, fm|
      exp = fm["expires"] ? " expira=#{fm['expires']}" : ""
      puts "#{fm['status'].to_s.ljust(8)} #{fm['type'].to_s.ljust(8)} de #{fm['from']} #{File.basename(p)}#{exp}"
    end
  end

when "send"
  guard_canonical!
  from = identity(opts)
  %i[to type slug].each { |k| die("falta --#{k}") if opts[k].to_s.strip.empty? }
  die("type inválido (#{TYPES.join('|')})") unless TYPES.include?(opts[:type])
  sender = member(from)
  rcpt = member(opts[:to])
  die("#{opts[:to]} no está en el roster") unless rcpt
  if kind(sender) == "agent" && sender["status"] != "active"
    die("#{from} está #{sender['status']}: solo puede escribir a su owner") unless opts[:to] == sender["owner"].to_s
  end
  die("#{opts[:to]} está #{rcpt['status']}: no recibe. Escribí a su owner #{rcpt['owner']}") unless can_receive?(rcpt)
  body = opts[:file] ? File.read(opts[:file]) : opts[:text].to_s
  die("mensaje vacío: --text o --file") if body.strip.empty?

  inbox = messages(opts[:to])
  pending = inbox.select { |_, fm| fm["from"] == from && !CLOSED.include?(fm["status"].to_s) }
  safe = opts[:slug].downcase.gsub(/[^a-z0-9]+/, "-").gsub(/\A-|-\z/, "")
  dup = pending.find { |p, _| File.basename(p).end_with?("-#{from}-#{safe}.md") }
  die("ya tenés abierto #{File.basename(dup[0])}: esperá o cancelalo") if dup
  if pending.size >= MAX_PENDING_PER_SENDER && opts[:type] != "cancel"
    die("#{from} ya tiene #{pending.size} pendientes con #{opts[:to]} (tope #{MAX_PENDING_PER_SENDER})")
  end

  if opts[:reply_to]
    index = messages.to_h { |p, fm| [File.basename(p), fm] }
    die("reply_to #{opts[:reply_to]} no existe") unless index.key?(opts[:reply_to])
    depth = thread_depth(opts[:reply_to], index) + 1
    both_agents = kind(sender) == "agent" && kind(rcpt) == "agent"
    if both_agents && depth > MAX_THREAD
      die("hilo de #{depth} mensajes entre agentes (tope #{MAX_THREAD}): escribí a tu owner con --type question", 4)
    end
  end
  puts write_message(from: from, to: opts[:to], type: opts[:type], slug: opts[:slug], body: body,
                     reply_to: opts[:reply_to], expires: opts[:expires], refs: opts[:refs])

when "claim", "done", "decline"
  path = find_message(ARGV.shift || die("falta el archivo"))
  actor = identity(opts)
  owner_dir = File.basename(File.dirname(path))
  die("solo #{owner_dir} cambia el estado de sus mensajes") unless actor == owner_dir
  die("decline requiere --note con el motivo") if cmd == "decline" && opts[:note].to_s.strip.empty?
  status = { "claim" => "claimed", "done" => "done", "decline" => "declined" }[cmd]
  set_status(path, status, actor, opts[:note])
  puts "#{File.basename(path)} → #{status}"

when "cancel"
  guard_canonical!
  path = find_message(ARGV.shift || die("falta el archivo"))
  actor = identity(opts)
  fm, = frontmatter(path)
  die("solo el remitente (#{fm['from']}) puede cancelar este pedido") unless fm["from"].to_s == actor
  die("ya está #{fm['status']}") if CLOSED.include?(fm["status"].to_s)
  die("cancel requiere --note con el motivo") if opts[:note].to_s.strip.empty?
  puts write_message(from: actor, to: fm["to"], type: "cancel", slug: "cancela-#{File.basename(path, '.md')[-40..] || 'pedido'}",
                     body: "## Pedido\n\nDesestimar `#{File.basename(path)}`: #{opts[:note]}\n\nEl destinatario lo cierra con `decline`.",
                     reply_to: File.basename(path))

when "archive"
  id = identity(opts)
  dest = File.join(INBOX, id, "archive")
  moved = 0
  messages(id).each do |p, fm|
    next unless CLOSED.include?(fm["status"].to_s)

    FileUtils.mkdir_p(dest)
    FileUtils.mv(p, File.join(dest, File.basename(p)))
    moved += 1
  end
  puts "archivados: #{moved}"

else
  puts File.read(__FILE__).lines.grep(/^#   /).map { |l| l.sub(/^#   /, "") }.join
  exit(cmd.nil? || cmd == "help" ? 0 : 1)
end
