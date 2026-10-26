#!/usr/bin/env ruby
# frozen_string_literal: true

# dt-agent — operaciones de miembros e inbox (contrato: vitals/specs/agent-inbox.md).
#
# Identidad: --as <id>  >  $DT_AGENT_ID  >  vitals/ops/session.yaml
#
# Uso: ver `dt-agent help`

require_relative "lib/force_utf8"
require "yaml"
require "time"
require "fileutils"
require "optparse"
require "open3"

ROOT = File.expand_path("..", __dir__)
ROSTER = File.join(ROOT, "vitals/config/roster.yaml")
SESSION = File.join(ROOT, "vitals/ops/session.yaml")
INBOX = File.join(ROOT, "vitals/work/inbox")
CANONICAL = File.join(ROOT, "vitals/ops/canonical-checkout.yaml")

ID_RE = /\A[a-z0-9][a-z0-9-]{1,30}\z/.freeze
TYPES = %w[request handoff question fyi cancel].freeze # escalate solo por `escalate`
CLOSED = %w[done declined cancelled].freeze
MAX_THREAD = 5
MAX_PENDING_PER_SENDER = 3
MAX_PENDING_REGISTRATIONS = 3
MAX_BROADCAST = 5
PRIORITY_DIR = "priority"
PRIORITY_TTL_HOURS = 72
MAX_PAUSED_PER_MEMBER = 5
FYI_EXPIRE_DAYS = 7
INBOX_REL = "vitals/work/inbox"

def die(msg, code = 1)
  warn "dt-agent: #{msg}"
  exit code
end

def now
  Time.now.iso8601
end

def validate_id!(id)
  die("id inválido (#{id}): use minúsculas, números y guiones (2–31 caracteres)") unless id.to_s.match?(ID_RE)
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

def identity(opts, allow_as: true)
  id = allow_as ? (opts[:as] || ENV["DT_AGENT_ID"]) : nil
  if id.to_s.empty? && File.exist?(SESSION)
    id = ((YAML.safe_load(File.read(SESSION), permitted_classes: [Date, Time]) || {})["operator"] || {})["id"]
  end
  die("sin identidad: usá --as, DT_AGENT_ID o /yo") if id.to_s.empty?
  validate_id!(id)
  id.to_s
end

def human_session_identity!(opts)
  die("modo agente: este comando es solo para el owner humano (sin DT_AGENT_ID)") unless ENV["DT_AGENT_ID"].to_s.empty?
  die("--as no vale aquí: corré /yo como owner humano") unless opts[:as].to_s.empty?
  id = identity(opts, allow_as: false)
  die("#{id} no es humano del roster") unless kind(member(id)) == "human"
  id
end

def agent_owned_by?(human_id, agent_id)
  m = member(agent_id)
  m && kind(m) == "agent" && m["owner"].to_s == human_id
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

def priority_path?(path)
  File.basename(File.dirname(path)) == PRIORITY_DIR
end

def inbox_owner(path)
  dir = File.dirname(path)
  File.basename(priority_path?(path) ? File.dirname(dir) : dir)
end

def inbox_realpath
  FileUtils.mkdir_p(INBOX)
  File.realpath(INBOX)
end

def secure_inbox_path(path)
  expanded = File.expand_path(path)
  die("no encuentro el mensaje") unless File.exist?(expanded)
  base = inbox_realpath
  real = File.realpath(expanded)
  die("mensaje fuera del inbox") unless real.start_with?("#{base}#{File::SEPARATOR}") || real == base
  real
end

def messages(id = nil)
  patterns = id ? [File.join(INBOX, id, "*.md"), File.join(INBOX, id, PRIORITY_DIR, "*.md")] :
                  [File.join(INBOX, "*", "*.md"), File.join(INBOX, "*", PRIORITY_DIR, "*.md")]
  Dir.glob(patterns).map do |p|
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
  path = if File.exist?(arg)
           File.expand_path(arg)
         else
           Dir.glob([File.join(INBOX, "*", arg), File.join(INBOX, "*", PRIORITY_DIR, arg),
                     File.join(INBOX, "*", "archive", arg)]).first
         end
  die("no encuentro el mensaje #{arg}") unless path && File.exist?(path)
  secure_inbox_path(path)
end

def set_status(path, status, actor, note, set: {}, drop: [])
  fm, text = frontmatter(path)
  die("#{path}: sin frontmatter") unless fm
  close = text.index("\n---", 4)
  body = text[(close + 4)..].to_s
  fm = fm.merge("status" => status).merge(set)
  drop.each { |k| fm.delete(k) }
  line = "- #{now} #{actor}: #{status}#{note.to_s.empty? ? '' : " — #{note}"}"
  body = body.include?("## Registro") ? "#{body.rstrip}\n#{line}\n" : "#{body.rstrip}\n\n## Registro\n\n#{line}\n"
  File.write(path, "#{fm.to_yaml}---#{body}")
end

TRANSITIONS = {
  "claim" => %w[open],
  "done" => %w[open claimed],
  "decline" => %w[open claimed paused],
  "park" => %w[open claimed],
  "resume" => %w[paused]
}.freeze

def check_transition!(cmd, fm)
  allowed = TRANSITIONS.fetch(cmd)
  return if allowed.include?(fm["status"].to_s)

  hint = fm["status"].to_s == "paused" ? " (está en pausa: `resume` primero, o `decline`)" : ""
  die("#{cmd} no aplica a un mensaje #{fm['status']}#{hint}")
end

def lane_holder(id)
  messages(id).find { |p, fm| priority_path?(p) && %w[open claimed].include?(fm["status"].to_s) }
end

def write_message(from:, to:, type:, slug:, body:, reply_to: nil, expires: nil, refs: [], extra: {}, lane: false)
  validate_id!(from)
  validate_id!(to)
  dir = lane ? File.join(INBOX, to, PRIORITY_DIR) : File.join(INBOX, to)
  FileUtils.mkdir_p(dir)
  stamp = Time.now.strftime("%Y%m%d-%H%M")
  safe = slug.downcase.gsub(/[^a-z0-9]+/, "-").gsub(/\A-|-\z/, "")
  path = File.join(dir, "#{stamp}-#{from}-#{safe}.md")
  die("ya existe #{path}") if File.exist?(path)
  fm = { "from" => from, "to" => to, "type" => type, "status" => "open", "created" => now }
  fm["reply_to"] = reply_to if reply_to
  fm["expires"] = expires if expires
  fm["refs"] = refs unless refs.empty?
  fm.merge!(extra)
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

def resolve_inbox_actor(path, opts, cmd)
  fm, = frontmatter(path)
  owner_dir = inbox_owner(path)
  if opts[:on_behalf]
    human = human_session_identity!(opts)
    die("--on-behalf solo con park|resume|cancel|escalate") unless %w[park resume cancel escalate].include?(cmd)
    die("#{owner_dir} no es un agente tuyo") unless agent_owned_by?(human, owner_dir)
    label = "#{human} (on-behalf #{owner_dir})"
    return [human, owner_dir, label, fm]
  end
  actor = identity(opts)
  die("solo #{owner_dir} cambia el estado de sus mensajes") unless actor == owner_dir
  [actor, owner_dir, actor, fm]
end

def send_one(from, to, opts, body, broadcast_id: nil)
  sender = member(from)
  rcpt = member(to)
  die("#{to} no está en el roster") unless rcpt
  if kind(sender) == "agent" && sender["status"] != "active"
    die("#{from} está #{sender['status']}: solo puede escribir a su owner") unless to == sender["owner"].to_s
  end
  die("#{to} está #{rcpt['status']}: no recibe. Escribí a su owner #{rcpt['owner']}") unless can_receive?(rcpt)

  inbox = messages(to).reject { |p, _| priority_path?(p) }
  mine = inbox.select { |_, fm| fm["from"] == from && !CLOSED.include?(fm["status"].to_s) }
  pending = mine.select { |_, fm| %w[open claimed].include?(fm["status"].to_s) }
  safe = opts[:slug].downcase.gsub(/[^a-z0-9]+/, "-").gsub(/\A-|-\z/, "")
  dup = mine.find { |p, _| File.basename(p).end_with?("-#{from}-#{safe}.md") }
  die("ya tenés #{File.basename(dup[0])} (#{dup[1]['status']}): esperá o cancelalo") if dup
  if pending.size >= MAX_PENDING_PER_SENDER && opts[:type] != "cancel"
    die("#{from} ya tiene #{pending.size} pendientes con #{to} (tope #{MAX_PENDING_PER_SENDER}). Si uno es urgente: `escalate`")
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

  expires = opts[:expires]
  expires = (Time.now + FYI_EXPIRE_DAYS * 86_400).iso8601 if opts[:type] == "fyi" && expires.to_s.empty?
  extra = {}
  extra["broadcast_id"] = broadcast_id if broadcast_id

  write_message(from: from, to: to, type: opts[:type], slug: opts[:slug], body: body,
                reply_to: opts[:reply_to], expires: expires, refs: opts[:refs], extra: extra)
end

def git_inbox_porcelain
  out, status = Open3.capture2e("git", "-C", ROOT, "status", "--porcelain", INBOX_REL)
  status.success? ? out.lines : []
end

def sync_paths_for(id)
  paths = []
  git_inbox_porcelain.each do |line|
    next if line.strip.empty?

    rest = line[3..].strip
    oldp, newp = rest.split(" -> ", 2).map(&:strip)
    candidates = [newp, oldp].compact
    candidates.each do |rel|
      next unless rel.start_with?("#{INBOX_REL}/")

      full = File.join(ROOT, rel)
      next unless File.exist?(full) && full.end_with?(".md")

      if rel.start_with?("#{INBOX_REL}/#{id}/")
        paths << rel
        next
      end
      fm, = frontmatter(full)
      paths << rel if fm && fm["from"].to_s == id
    end
  end
  paths.uniq
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
  o.on("--reason R") { |v| opts[:reason] = v }
  o.on("--until F") { |v| opts[:expires] = v }
  o.on("--all") { opts[:all] = true }
  o.on("--team") { opts[:team] = true }
  o.on("--on-behalf") { opts[:on_behalf] = true }
  o.on("--closed") { opts[:closed] = true }
  o.on("--fyi") { opts[:fyi] = true }
  o.on("--message M") { |v| opts[:message] = v }
  o.on("--push") { opts[:push] = true }
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
  validate_id!(opts[:id])
  die("#{opts[:id]} ya está en el roster") if member(opts[:id])
  owner = member(opts[:owner])
  die("owner #{opts[:owner]} no es un humano del roster (primero /yo de una persona)") unless owner && kind(owner) == "human"
  pending_n = roster.count { |m| kind(m) == "agent" && m["owner"].to_s == opts[:owner] && m["status"].to_s == "pending" }
  die("el owner ya tiene #{pending_n} altas pending (tope #{MAX_PENDING_REGISTRATIONS})") if pending_n >= MAX_PENDING_REGISTRATIONS
  rel = nil
  begin
    rel = write_message(from: opts[:id], to: opts[:owner], type: "request", slug: "alta-#{opts[:id]}",
                        body: "## Pedido\n\nAlta de `#{opts[:id]}` como miembro agente.\n\n- Runtime: #{opts[:runtime]}\n- Scope: #{opts[:scope]}\n\nActivar: `./scripts/dt-agent.sh activate #{opts[:id]}`")
    append_roster("id" => opts[:id], "kind" => "agent", "name" => opts[:name], "owner" => opts[:owner],
                  "runtime" => opts[:runtime], "scope" => opts[:scope], "status" => "pending", "registered_at" => now)
  rescue StandardError => e
    File.delete(File.join(ROOT, rel)) if rel && File.exist?(File.join(ROOT, rel))
    die(e.message)
  end
  puts "alta pending. Pedido al owner: #{rel}. Terminá la corrida hasta que el owner active."

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
  die("--as no vale para #{cmd}: corré /yo como owner humano") unless opts[:as].to_s.empty?
  die("#{cmd} es solo para personas: DT_AGENT_ID está definida (modo agente). Pedíselo al owner", 5) unless ENV["DT_AGENT_ID"].to_s.empty?
  target = ARGV.shift or die("falta el id del agente")
  validate_id!(target)
  actor = identity(opts, allow_as: false)
  m = member(target)
  die("#{target} no es un agente del roster") unless m && kind(m) == "agent"
  die("solo el owner (#{m['owner']}) puede cambiar el estado de #{target}") unless actor == m["owner"].to_s && kind(member(actor)) == "human"
  status = { "activate" => "active", "pause" => "paused", "retire" => "retired" }[cmd]
  set_member_status(target, status, actor)
  puts "#{target} → #{status}"
  if kind(member(actor)) == "human" && member(actor)["email"].to_s.strip.empty?
    warn "aviso: #{actor} no tiene email en el roster; dt-doctor no podrá verificar quién hizo este cambio. Agregalo (git config user.email)."
  end

when "members"
  roster.each do |m|
    next unless opts[:all] || can_receive?(m)

    holder = lane_holder(m["id"])
    lane = holder ? "carril=ocupado(#{holder[1]['from']})" : "carril=libre"
    puts [m["id"], kind(m), m["status"] || "active", m["owner"], m["scope"], lane].compact.join(" | ")
  end

when "inbox"
  id = identity(opts)
  ids = [id]
  ids += roster.select { |m| m["owner"].to_s == id }.map { |m| m["id"] } if opts[:team]
  ids.each do |who|
    list = messages(who).reject { |_, fm| !opts[:all] && CLOSED.include?(fm["status"].to_s) }
    rank = lambda do |p, fm|
      next 0 if priority_path?(p) && !CLOSED.include?(fm["status"].to_s)

      { "claimed" => 1, "open" => 2, "paused" => 3 }.fetch(fm["status"].to_s, 4)
    end
    list.sort_by! { |p, fm| [rank.call(p, fm), File.basename(p)] }
    puts "## #{who} (#{list.size})"
    list.each do |p, fm|
      tag = priority_path?(p) ? "URGENTE" : fm["status"].to_s
      exp = fm["expires"] && fm["status"].to_s != "paused" ? " expira=#{fm['expires']}" : ""
      extra = if priority_path?(p) then " motivo=\"#{fm['reason']}\" escala=#{fm['escalates']}"
              elsif fm["status"].to_s == "paused" then " pausa=\"#{fm['paused_reason']}\"#{fm['resume_after'] ? " hasta=#{fm['resume_after']}" : ''}"
              else "" end
      puts "#{tag.ljust(8)} #{fm['type'].to_s.ljust(8)} de #{fm['from']} #{File.basename(p)}#{exp}#{extra}"
    end
  end

when "send"
  guard_canonical!
  from = identity(opts)
  %i[type slug].each { |k| die("falta --#{k}") if opts[k].to_s.strip.empty? }
  die("falta --to") if opts[:to].to_s.strip.empty?
  die("type inválido (#{TYPES.join('|')})") unless TYPES.include?(opts[:type])
  body = opts[:file] ? File.read(opts[:file]) : opts[:text].to_s
  die("mensaje vacío: --text o --file") if body.strip.empty?

  recipients = opts[:to].split(",").map(&:strip).reject(&:empty?)
  die("falta destinatario en --to") if recipients.empty?
  die("máximo #{MAX_BROADCAST} destinatarios en --to") if recipients.size > MAX_BROADCAST
  recipients.each { |r| validate_id!(r) }

  broadcast_id = recipients.size > 1 ? "bc-#{Time.now.to_i}-#{rand(1000)}" : nil
  recipients.each { |to| puts send_one(from, to, opts.merge(to: to), body, broadcast_id: broadcast_id) }

when "claim", "done", "decline"
  path = find_message(ARGV.shift || die("falta el archivo"))
  actor, _owner_dir, label, fm = resolve_inbox_actor(path, opts, cmd)
  die("decline requiere --note con el motivo") if cmd == "decline" && opts[:note].to_s.strip.empty?
  check_transition!(cmd, fm)
  status = { "claim" => "claimed", "done" => "done", "decline" => "declined" }[cmd]
  set_status(path, status, label, opts[:note], drop: %w[paused_from paused_at paused_reason resume_after])
  puts "#{File.basename(path)} → #{status}"
  if priority_path?(path) && cmd == "decline"
    who = [fm["from"].to_s]
    who << member(fm["from"])["owner"].to_s if kind(member(fm["from"])) == "agent"
    who.reject(&:empty?).uniq.each do |t|
      write_message(from: actor, to: t, type: "fyi", slug: "urgente-rechazado",
                    body: "## Aviso\n\n`#{actor}` rechazó el urgente `#{File.basename(path)}`.\n\nMotivo: #{opts[:note]}",
                    refs: [File.basename(path)])
    end
  end

when "park"
  path = find_message(ARGV.shift || die("falta el archivo"))
  actor, owner_dir, label, fm = resolve_inbox_actor(path, opts, "park")
  die("el urgente no se pausa: tomalo (`claim`) o rechazalo con motivo (`decline`)") if priority_path?(path)
  die("park requiere --note con el motivo") if opts[:note].to_s.strip.empty?
  check_transition!("park", fm)
  paused = messages(owner_dir).count { |_, f| f["status"].to_s == "paused" }
  die("#{owner_dir} ya tiene #{paused} mensajes en pausa (tope #{MAX_PAUSED_PER_MEMBER}). Retomá (`resume`) o cerrá alguno") if paused >= MAX_PAUSED_PER_MEMBER
  extra = { "paused_from" => fm["status"].to_s, "paused_at" => now, "paused_reason" => opts[:note] }
  extra["resume_after"] = opts[:expires] if opts[:expires]
  extra["parked_by"] = actor if opts[:on_behalf]
  set_status(path, "paused", label, opts[:note], set: extra)
  puts "#{File.basename(path)} → paused. Libera un cupo de #{fm['from']} (el remitente puede enviar otro)."

when "resume"
  path = find_message(ARGV.shift || die("falta el archivo"))
  _actor, _owner_dir, label, fm = resolve_inbox_actor(path, opts, "resume")
  check_transition!("resume", fm)
  back = %w[open claimed].include?(fm["paused_from"].to_s) ? fm["paused_from"].to_s : "open"
  set_status(path, back, label, "retomado", drop: %w[paused_from paused_at paused_reason resume_after parked_by])
  puts "#{File.basename(path)} → #{back}"

when "escalate"
  guard_canonical!
  path = find_message(ARGV.shift || die("falta el archivo"))
  fm, = frontmatter(path)
  if opts[:on_behalf]
    human = human_session_identity!(opts)
    die("solo podés escalar pedidos de tus agentes") unless agent_owned_by?(human, fm["from"].to_s)
    actor = human
    label = "#{human} (on-behalf #{fm['from']})"
  else
    actor = identity(opts)
    die("solo el remitente (#{fm['from']}) escala su propio pedido") unless fm["from"].to_s == actor
    label = actor
  end
  die("un urgente no se escala") if priority_path?(path)
  die("ya está #{fm['status']}: no hay nada que escalar") if CLOSED.include?(fm["status"].to_s)
  die("escalate requiere --reason con el motivo de la urgencia") if opts[:reason].to_s.strip.empty?
  target = fm["to"].to_s
  rcpt = member(target)
  die("#{target} no recibe (#{rcpt && rcpt['status']})") unless can_receive?(rcpt)
  holder = lane_holder(target)
  if holder
    owner = kind(rcpt) == "agent" ? rcpt["owner"].to_s : ""
    hint = owner.empty? ? "Esperá a que se libere o coordiná con #{target} fuera del sistema." :
           "Escribile a su owner para que decida: ./scripts/dt-agent.sh send --to #{owner} --type question --slug carril-#{target} --text \"...\""
    die("el carril de #{target} está ocupado por #{holder[1]['from']} (#{File.basename(holder[0])}). #{hint}", 6)
  end
  ttl = (Time.now + PRIORITY_TTL_HOURS * 3600).iso8601
  base = File.basename(path)
  out = write_message(from: fm["from"].to_s, to: target, type: "escalate", slug: "urgente-#{base[/-#{fm['from']}-(.*)\.md\z/, 1] || 'pedido'}",
                      body: "## Urgente\n\nEscala `#{base}` (por #{label}).\n\nMotivo: #{opts[:reason]}", lane: true, expires: ttl,
                      refs: [base], extra: { "escalates" => base, "reason" => opts[:reason] })
  puts out
  if kind(rcpt) == "agent" && !rcpt["owner"].to_s.empty?
    write_message(from: fm["from"].to_s, to: rcpt["owner"].to_s, type: "fyi", slug: "urgente-para-#{target}",
                  body: "## Aviso\n\n`#{fm['from']}` abrió un urgente para `#{target}`: #{opts[:reason]}\n\nVer `#{out}`.",
                  refs: [base])
  end
  puts "original #{base} sigue #{fm['status']}; vence #{ttl}"

when "sent"
  me = identity(opts)
  list = messages.select { |_, fm| fm["from"].to_s == me && !CLOSED.include?(fm["status"].to_s) }
  list.sort_by! { |p, _| File.basename(p) }
  puts "## enviados por #{me} (#{list.size})"
  list.each do |p, fm|
    tag = priority_path?(p) ? "URGENTE" : fm["status"].to_s
    puts "#{tag.ljust(8)} para #{fm['to']} #{File.basename(p)}#{fm['status'].to_s == 'paused' ? " pausa=\"#{fm['paused_reason']}\"" : ''}"
  end

when "cancel"
  guard_canonical!
  path = find_message(ARGV.shift || die("falta el archivo"))
  fm, = frontmatter(path)
  if opts[:on_behalf]
    human = human_session_identity!(opts)
    owner_dir = inbox_owner(path)
    die("#{owner_dir} no es un agente tuyo") unless agent_owned_by?(human, owner_dir)
    actor = human
    label = "#{human} (on-behalf #{owner_dir})"
  else
    actor = identity(opts)
    die("solo el remitente (#{fm['from']}) puede cancelar este pedido") unless fm["from"].to_s == actor
    label = actor
  end
  die("ya está #{fm['status']}") if CLOSED.include?(fm["status"].to_s)
  die("cancel requiere --note con el motivo") if opts[:note].to_s.strip.empty?
  set_status(path, "cancelled", label, opts[:note], set: { "cancelled_by" => actor })
  puts "#{File.basename(path)} → cancelled"
  write_message(from: actor, to: fm["to"].to_s, type: "fyi", slug: "cancel-#{File.basename(path, '.md')[-36..] || 'aviso'}",
                body: "## Aviso\n\n`#{File.basename(path)}` cancelado: #{opts[:note]}", refs: [File.basename(path)])

when "ack"
  id = identity(opts)
  die("ack requiere --fyi") unless opts[:fyi]
  n = 0
  messages(id).each do |p, fm|
    next unless fm["type"].to_s == "fyi" && fm["status"].to_s == "open"

    set_status(p, "done", id, "ack fyi")
    n += 1
  end
  puts "fyi cerrados: #{n}"

when "archive"
  id = identity(opts)
  dest = File.join(INBOX, id, "archive")
  moved = 0
  messages(id).each do |p, fm|
    next unless CLOSED.include?(fm["status"].to_s)
    next if opts[:closed] && !CLOSED.include?(fm["status"].to_s)

    FileUtils.mkdir_p(dest)
    FileUtils.mv(p, File.join(dest, File.basename(p)))
    moved += 1
  end
  puts "archivados: #{moved}"

when "sync"
  id = identity(opts)
  msg = opts[:message].to_s.strip
  die("sync requiere --message") if msg.empty?
  paths = sync_paths_for(id)
  die("sync: no hay cambios propios en el inbox para commitear") if paths.empty?
  paths.each { |p| system("git", "-C", ROOT, "add", "--", p) || die("git add falló") }
  trailer = ["DT-Member: #{id}"]
  _, st = Open3.capture2e("git", "-C", ROOT, "commit", "-m", msg, *trailer.flat_map { |t| ["--trailer", t] })
  die("git commit falló") unless st.success?
  puts "commit inbox: #{paths.size} archivo(s)"
  if opts[:push]
    _, pst = Open3.capture2e("git", "-C", ROOT, "push")
    die("git push falló") unless pst.success?
    puts "push OK"
  end

else
  puts File.read(__FILE__).lines.grep(/^#   /).map { |l| l.sub(/^#   /, "") }.join
  puts "  sync --message M [--push]     commit solo archivos propios del inbox (sin bump)"
  puts "  ack --fyi                     cierra todos los fyi abiertos del dueño"
  puts "  send --to a,b,c               broadcast (máx #{MAX_BROADCAST})"
  puts "  park|resume|cancel|escalate --on-behalf   owner humano sobre inbox de sus agentes"
  exit(cmd.nil? || cmd == "help" ? 0 : 1)
end
