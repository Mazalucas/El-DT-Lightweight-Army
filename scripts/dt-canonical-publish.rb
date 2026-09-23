#!/usr/bin/env ruby
# frozen_string_literal: true

# Gate de publicación al remoto oficial de El DT.
#
# Ningún checkout publica al DT hasta que el dueño corre /oficial en esa carpeta.
# El archivo que lo marca (vitals/ops/canonical-checkout.yaml) no viaja en git.
#
# Uso:
#   ruby scripts/dt-canonical-publish.rb gate
#   ruby scripts/dt-canonical-publish.rb status
#   ruby scripts/dt-canonical-publish.rb activate [--yes]
#   ruby scripts/dt-canonical-publish.rb off
#   ruby scripts/dt-canonical-publish.rb install-hook
#   ruby scripts/dt-canonical-publish.rb push-remote <url>
#   ruby scripts/dt-canonical-publish.rb self-check
#
# Exit (gate / status / activate / off):
#   0  publicar al DT permitido, o acción hecha
#   10 origin (o el url dado) no es el DT — el push a ese remoto sigue
#   20 no hay origin — commit local, sin push
#   30 origin es el DT y este checkout no está activado, o la marca no coincide
#   40 origin es el DT, la marca coincide, y la sesión de GitHub no es el dueño
#   2  activate esperando confirmación (--yes)
#   1  error o activate rechazado

require "fileutils"
require "open3"
require "time"
require "yaml"

ROOT = File.expand_path("..", __dir__)
CONFIG_PATH = File.join(ROOT, "vitals/config/canonical-publish.yaml")
SENTINEL_PATH = File.join(ROOT, "vitals/ops/canonical-checkout.yaml")
HOOK_MARKER = "dt-canonical-publish"

module DtCanonicalPublish
  module_function

  def canonical_slug(url)
    raw = url.to_s.strip
    return nil if raw.empty?

    host = nil
    path = nil
    if (match = raw.match(/\Agit@([^:]+):(.+)\z/))
      host = match[1]
      path = match[2]
    elsif (match = raw.match(%r{\A(?:ssh|git)://(?:[^@/]+@)?([^/]+)/(.+)\z}))
      host = match[1]
      path = match[2]
    elsif (match = raw.match(%r{\Ahttps?://(?:[^@/]+@)?([^/]+)/(.+)\z}))
      host = match[1]
      path = match[2]
    else
      return nil
    end

    path = path.split("?", 2).first.to_s
    path = path.sub(/\.git\z/i, "").sub(%r{/\z}, "").sub(%r{\A/+}, "")
    return nil if host.nil? || host.empty? || path.empty?

    "#{host.downcase}/#{path}"
  end

  def git_out(*args)
    out, status = Open3.capture2("git", "-C", ROOT, *args)
    return nil unless status.success?

    out.strip
  end

  def git_toplevel
    raw = git_out("rev-parse", "--show-toplevel")
    raise "no hay repo git en #{ROOT}" if raw.nil? || raw.empty?

    File.realpath(raw)
  end

  def origin_url
    out, _err, status = Open3.capture3("git", "-C", ROOT, "remote", "get-url", "origin")
    return nil unless status.success?

    url = out.strip
    url.empty? ? nil : url
  end

  def github_login
    out, _err, status = Open3.capture3("gh", "api", "user", "--jq", ".login")
    return nil unless status.success?

    login = out.strip
    login.empty? ? nil : login
  end

  def read_sentinel
    return nil unless File.exist?(SENTINEL_PATH)

    data = YAML.safe_load(File.read(SENTINEL_PATH), permitted_classes: [])
    data.is_a?(Hash) ? data : nil
  rescue StandardError
    nil
  end

  def same_path?(left, right)
    File.realpath(left) == File.realpath(right)
  rescue StandardError
    false
  end

  def official_slug?(slug, config)
    !slug.nil? && slug == config["slug"]
  end

  def decide(destination_url, config)
    if destination_url.nil? || destination_url.strip.empty?
      return [20, no_origin_message]
    end

    slug = canonical_slug(destination_url)
    unless official_slug?(slug, config)
      return [10, own_remote_message(destination_url)]
    end

    activation_decision(slug, destination_url, config)
  end

  def activation_decision(slug, destination_url, config)
    publisher = config["login"]
    sentinel = read_sentinel
    if sentinel.nil?
      return [30, inactive_message(destination_url, publisher)]
    end

    current = git_toplevel
    saved = sentinel["git_toplevel"].to_s
    unless same_path?(saved, current)
      return [30, path_mismatch_message(saved, current)]
    end

    saved_slug = sentinel["origin_slug"].to_s
    saved_slug = canonical_slug(sentinel["origin_url"].to_s) if saved_slug.empty?
    unless saved_slug == slug
      return [30, remote_mismatch_message(sentinel["origin_url"].to_s, destination_url)]
    end

    unless sentinel["publisher_github_login"].to_s == publisher
      return [30, inactive_message(destination_url, publisher)]
    end

    login = github_login
    unless login == publisher
      shown = login.nil? || login.empty? ? "ausente" : login
      return [40, wrong_login_message(shown, publisher)]
    end

    [0, allowed_message(current, destination_url, login)]
  end

  def no_origin_message
    <<~MSG.strip
      No hay origin. El commit puede quedar en local, sin push y sin tag remoto.
      No agregues el remoto oficial del DT.
      Siguiente paso: un repo tuyo (`git remote add origin <url>`) o `/bootstrap` si este clone era el template.
    MSG
  end

  def own_remote_message(url)
    "origin no es el DT oficial (#{url}). El push, si sigue /guardar, va a ese remoto."
  end

  def inactive_message(url, publisher)
    <<~MSG.strip
      Este checkout no puede publicar al DT.
      El destino es el remoto oficial (#{url}) y esta carpeta no está activada con /oficial.
      No hago bump, ni commit, ni push. No pidas acceso al repo.

      Si esta carpeta es el DT de verdad y tu GitHub es #{publisher}: /oficial
      Si es otro proyecto: `git stash`, `/bootstrap`, `git stash pop`, y un origin propio.
      Para traer el framework: /actualizar-dt.
    MSG
  end

  def path_mismatch_message(saved, current)
    <<~MSG.strip
      Hay una marca de /oficial, pero la carpeta no coincide.
      Marcada: #{saved}
      Esta: #{current}
      No publico desde esta copia. No pidas acceso al repo.
      Si esta es la carpeta del DT y sos el dueño, corré /oficial acá.
      Si es otro proyecto: /bootstrap y un origin propio.
    MSG
  end

  def remote_mismatch_message(saved_url, current_url)
    <<~MSG.strip
      Hay una marca de /oficial para otro remoto (#{saved_url}).
      El destino actual es #{current_url}.
      No publico. No pidas acceso al repo.
    MSG
  end

  def wrong_login_message(shown, publisher)
    <<~MSG.strip
      Este remoto es el DT oficial. La sesión de GitHub es #{shown} y quien publica es #{publisher}.
      No hago bump, ni commit, ni push. No pidas acceso ni cambies de usuario para publicar el DT.
      Para traer el framework: /actualizar-dt.
      Para tu proyecto: /bootstrap y un origin propio.
    MSG
  end

  def allowed_message(path, url, login)
    <<~MSG.strip
      Checkout oficial activo. Se puede publicar al DT.
      Carpeta: #{path}
      origin: #{url}
      GitHub: #{login}
      Sesión, roster y notas de esta máquina quedan acá. El remoto oficial publica el framework, con `team: []`.
    MSG
  end

  def report(code, message)
    puts "DT_PUBLISH_GATE exit=#{code}"
    puts message
    code
  end

  def yaml_double(value)
    '"' + value.to_s.gsub("\\", "\\\\").gsub('"', '\\"') + '"'
  end

  def write_sentinel(login, origin, slug, toplevel)
    FileUtils.mkdir_p(File.dirname(SENTINEL_PATH))
    body = <<~YAML
      version: 1
      activated_at: #{yaml_double(Time.now.iso8601)}
      publisher_github_login: #{yaml_double(login)}
      origin_url: #{yaml_double(origin)}
      origin_slug: #{yaml_double(slug)}
      git_toplevel: #{yaml_double(toplevel)}
    YAML
    File.write(SENTINEL_PATH, body)
  end

  def hooks_dir
    raw = git_out("rev-parse", "--git-path", "hooks")
    raise "no pude resolver .git/hooks" if raw.nil? || raw.empty?

    dir = raw.start_with?("/") ? raw : File.expand_path(raw, ROOT)
    FileUtils.mkdir_p(dir)
    dir
  end

  def hook_body
    <<~SH
      #!/usr/bin/env bash
      # #{HOOK_MARKER} — pre-push de El DT.
      # Bloquea el push al remoto oficial si este checkout no está activado
      # o si el commit lleva sesión, roster, inbox u otras notas locales.
      root="$(git rev-parse --show-toplevel)"
      url="${2:-}"
      status=0
      saw=0
      while read -r _local_ref local_sha _remote_ref _remote_sha; do
        saw=1
        if [[ "$local_sha" =~ ^0+$ ]]; then
          continue
        fi
        if ! ruby "$root/scripts/dt-canonical-publish.rb" push-remote "$url" "$local_sha"; then
          status=1
        fi
      done
      if [[ "$saw" -eq 0 ]]; then
        ruby "$root/scripts/dt-canonical-publish.rb" push-remote "$url" || status=$?
      fi
      if [[ "$status" -ne 0 ]]; then
        exit "$status"
      fi
      local_hook="$(cd "$(dirname "$0")" && pwd)/pre-push.local"
      if [[ -x "$local_hook" ]]; then
        exec "$local_hook" "$@"
      fi
      exit 0
    SH
  end

  def install_hook!
    dir = hooks_dir
    dest = File.join(dir, "pre-push")
    body = hook_body
    if File.exist?(dest) && !File.read(dest).include?(HOOK_MARKER)
      local = File.join(dir, "pre-push.local")
      if File.exist?(local)
        warn "dt-canonical-publish: reemplacé pre-push; pre-push.local ya existía y no lo toqué"
      else
        FileUtils.mv(dest, local)
        warn "dt-canonical-publish: el pre-push anterior quedó en #{local}"
      end
    end
    changed = !File.exist?(dest) || File.read(dest) != body
    File.write(dest, body)
    File.chmod(0o755, dest)
    warn "dt-canonical-publish: pre-push instalado en #{dest}" if changed
    dest
  rescue StandardError => e
    warn "dt-canonical-publish: no pude instalar pre-push (#{e.message})"
    nil
  end

  def string_list(config, key)
    value = config[key]
    return [] unless value.is_a?(Array)

    value.map { |item| item.to_s }.reject(&:empty?)
  end

  def load_config
    raw = YAML.safe_load(File.read(CONFIG_PATH), permitted_classes: [])
    base = load_config_identity
    base["private_prefixes"] = string_list(raw, "private_prefixes")
    base["private_exact"] = string_list(raw, "private_exact")
    base["private_allow"] = string_list(raw, "private_allow")
    base
  end

  def load_config_identity
    unless File.exist?(CONFIG_PATH)
      raise "falta #{CONFIG_PATH}"
    end

    cfg = YAML.safe_load(File.read(CONFIG_PATH), permitted_classes: [])
    unless cfg.is_a?(Hash)
      raise "canonical-publish.yaml no es un mapa"
    end

    login = cfg["publisher_github_login"].to_s.strip
    remotes = cfg["official_remotes"]
    raise "publisher_github_login vacío" if login.empty?
    raise "official_remotes vacío" unless remotes.is_a?(Array) && !remotes.empty?

    slugs = remotes.map { |remote| canonical_slug(remote) }
    raise "official_remotes tiene una URL que no se puede leer" if slugs.any?(&:nil?)
    raise "official_remotes no apuntan al mismo repo" unless slugs.uniq.size == 1

    { "login" => login, "slug" => slugs.first, "remotes" => remotes }
  end

  def private_path?(path, config)
    clean = path.to_s.sub(%r{\A/+}, "")
    return false if clean.empty?
    return false if config["private_allow"].include?(clean)

    return true if config["private_exact"].include?(clean)

    config["private_prefixes"].any? do |prefix|
      folder = prefix.end_with?("/") ? prefix : "#{prefix}/"
      clean == prefix.sub(%r{/\z}, "") || clean.start_with?(folder)
    end
  end

  def roster_people(text)
    data = YAML.safe_load(text.to_s, permitted_classes: [])
    return [] unless data.is_a?(Hash)

    team = data["team"]
    return [] unless team.is_a?(Array)

    team.reject do |item|
      item.nil? || item.to_s.strip.empty? ||
        (item.is_a?(Hash) && item.values.all? { |value| value.nil? || value.to_s.strip.empty? })
    end
  rescue StandardError
    ["roster ilegible"]
  end

  def porcelain_paths(text)
    paths = []
    text.to_s.each_line do |line|
      next if line.strip.empty?

      body = line.length > 3 ? line[3..] : ""
      body = body.strip
      path = body.include?(" -> ") ? body.split(" -> ", 2).last : body
      path = path.delete_prefix('"').delete_suffix('"')
      paths << path unless path.empty?
    end
    paths
  end

  def worktree_traces(config)
    traces = []
    out, status = Open3.capture2("git", "-C", ROOT, "status", "--porcelain", "-uall")
    if status.success?
      porcelain_paths(out).each do |path|
        traces << path if private_path?(path, config)
      end
    end

    roster_texts.each do |text|
      people = roster_people(text)
      next if people.empty?

      traces << "vitals/config/roster.yaml (hay #{people.size} persona(s); el template publica team: [])"
    end
    traces.uniq
  end

  def roster_texts
    texts = []
    out, status = Open3.capture2("git", "-C", ROOT, "show", ":vitals/config/roster.yaml")
    texts << out if status.success?
    path = File.join(ROOT, "vitals/config/roster.yaml")
    texts << File.read(path) if File.exist?(path)
    texts
  end

  def tree_traces(sha, config)
    traces = []
    out, status = Open3.capture2("git", "-C", ROOT, "ls-tree", "-r", "--name-only", sha)
    if status.success?
      out.each_line do |line|
        path = line.strip
        traces << path if private_path?(path, config)
      end
    end

    roster, roster_status = Open3.capture2("git", "-C", ROOT, "show", "#{sha}:vitals/config/roster.yaml")
    if roster_status.success?
      people = roster_people(roster)
      unless people.empty?
        traces << "vitals/config/roster.yaml (hay #{people.size} persona(s); el template publica team: [])"
      end
    end
    traces.uniq
  end

  def traces_message(traces)
    listed = traces.map { |path| "- #{path}" }.join("\n")
    <<~MSG.strip
      Este checkout es el oficial, pero el publish llevaría rastros de esta máquina.
      Quien clona el framework no tiene que encontrar sesión, roster ni notas de tu interacción.
      No hago bump, ni commit, ni push de esto:

      #{listed}

      Dejalo en la máquina. No lo borres si es tu sesión. No lo stagees.
      El roster versionado tiene que seguir con `team: []`.
      La postura de esta carpeta va a `vitals/ops/collaboration.local.yaml`, no al archivo de Git.
      El cuaderno `vitals/work/inbox/` no se publica desde acá.
      Cuando esos paths no estén en el commit, volvé a correr el gate.
    MSG
  end

  def cmd_gate
    install_hook!
    config = load_config
    code, message = decide(origin_url, config)
    if code == 0
      traces = worktree_traces(config)
      exit report(50, traces_message(traces)) if traces.any?
    end
    exit report(code, message)
  end

  def cmd_push_remote(url, sha = nil)
    if url.nil? || url.strip.empty?
      warn "Push sin URL de destino. No lo dejo seguir."
      exit 1
    end

    config = load_config
    code, message = decide(url, config)
    if code == 10
      exit 0
    end
    unless code == 0
      warn message
      exit 1
    end

    traces = if sha && !sha.empty? && sha !~ /\A0+\z/
               tree_traces(sha, config)
             else
               worktree_traces(config)
             end
    if traces.any?
      warn traces_message(traces)
      exit 1
    end
    exit 0
  end

  def cmd_activate(confirmed)
    install_hook!
    config = load_config
    url = origin_url
    code, message = decide(url, config)
    if code == 0
      exit report(0, message)
    end
    if code == 20
      exit report(1, "No hay origin. /oficial solo marca un checkout cuyo origin es el DT oficial.")
    end
    if code == 10
      exit report(1, "origin no es el DT oficial (#{url}). /oficial no marca esta carpeta.")
    end

    publisher = config["login"]
    login = github_login
    unless login == publisher
      shown = login.nil? || login.empty? ? "ausente" : login
      exit report(1, wrong_login_message(shown, publisher))
    end

    toplevel = git_toplevel
    slug = canonical_slug(url)
    unless confirmed
      plan = <<~MSG.strip
        /oficial va a marcar esta carpeta como el único checkout que puede publicar al DT.
        Carpeta: #{toplevel}
        origin: #{url}
        GitHub: #{login}
        Confirmá en el chat que esta ruta es el DT oficial. Sin ese sí, no escribo la marca.
        Sesión, roster y notas de esta máquina no se publican. El template sigue con `team: []`.
      MSG
      exit report(2, plan)
    end

    write_sentinel(login, url, slug, toplevel)
    exit report(0, allowed_message(toplevel, url, login))
  end

  def cmd_off
    if File.exist?(SENTINEL_PATH)
      File.delete(SENTINEL_PATH)
      exit report(0, "Checkout oficial desactivado. /guardar ya no publica al DT desde esta carpeta.")
    end

    exit report(0, "Esta carpeta no estaba marcada como checkout oficial.")
  end

  def cmd_install_hook
    dest = install_hook!
    if dest
      exit report(0, "pre-push listo en #{dest}. Publicar al DT sigue exigiendo /oficial.")
    end

    exit report(1, "No pude instalar el pre-push.")
  end

  def cmd_self_check
    config = load_config
    base = config["slug"]
    host, path = base.split("/", 2)
    variants = [
      "https://#{host}/#{path}.git",
      "https://#{host}/#{path}",
      "git@#{host}:#{path}.git",
      "ssh://git@#{host}/#{path}.git",
      "https://user:token@#{host}/#{path}.git"
    ]
    variants.each do |variant|
      got = canonical_slug(variant)
      raise "#{variant} → #{got.inspect}, esperaba #{base}" unless got == base
    end
    raise "URL ajena coincidió con el DT" if canonical_slug("https://github.com/example/not-the-dt.git") == base
    raise "URL vacía no debería tener slug" unless canonical_slug("").nil? && canonical_slug("origin").nil?
    raise "falta la lista de rastros privados" if config["private_prefixes"].empty?

    raise "sesión no marcada como privada" unless private_path?("vitals/ops/session.yaml", config)
    raise "el README de ops no es un rastro" if private_path?("vitals/ops/README.md", config)
    raise "inbox no marcado como privado" unless private_path?("vitals/work/inbox/lucas/nota.md", config)
    raise "el gitkeep del inbox no debería bloquear" if private_path?("vitals/work/inbox/.gitkeep", config)
    raise "README de knowledge no debería bloquear" if private_path?("vitals/work/knowledge/README.md", config)
    raise "collaboration.yaml no marcado" unless private_path?("vitals/config/collaboration.yaml", config)
    raise "el ejemplo de collaboration no es el archivo real" if private_path?("vitals/config/collaboration.yaml.example", config)

    empty = roster_people("version: 1\nteam: []\n")
    raise "team vacío contó personas" unless empty.empty?
    people = roster_people("version: 1\nteam:\n  - id: ana\n    name: Ana\n")
    raise "no detectó una persona en el roster" unless people.size == 1

    puts "self-check OK #{base}"
  end
end

command = ARGV.shift || "gate"
case command
when "gate", "status"
  DtCanonicalPublish.cmd_gate
when "activate"
  DtCanonicalPublish.cmd_activate(ARGV.include?("--yes"))
when "off", "deactivate"
  DtCanonicalPublish.cmd_off
when "install-hook"
  DtCanonicalPublish.cmd_install_hook
when "push-remote"
  url = ARGV.shift
  sha = ARGV.shift
  if url.nil? || url.empty?
    warn "Uso: dt-canonical-publish.rb push-remote <url> [sha]"
    exit 1
  end
  DtCanonicalPublish.cmd_push_remote(url, sha)
when "self-check"
  DtCanonicalPublish.cmd_self_check
else
  warn "Uso: dt-canonical-publish.rb [gate|status|activate --yes|off|install-hook|push-remote <url>|self-check]"
  exit 1
end
