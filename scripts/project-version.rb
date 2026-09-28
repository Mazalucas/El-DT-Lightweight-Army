#!/usr/bin/env ruby
# frozen_string_literal: true

# Aislamiento semver: VERSION del producto ≠ framework_version del DT.
# Uso:
#   ruby scripts/project-version.rb resolve [--root DIR] [--dry-run]
#   ruby scripts/project-version.rb guard   [--root DIR]
#   ruby scripts/project-version.rb doctor  [--root DIR]
#
# Exit resolve/guard:
#   0  OK
#   2  versiones de producto en conflicto
#   3  VERSION coincide con framework_version (guard: hay que resolver antes)
#   64 uso

require "json"
require "yaml"

module DtProjectVersion
  SEMVER = /\A\d+\.\d+\.\d+\z/.freeze
  DISCOVER = %w[package.json frontend/package.json backend/package.json].freeze
  INITIAL_DEFAULT = "0.1.0"

  module_function

  def parse_args(argv)
    cmd = argv.shift
    root = nil
    dry_run = false
    while argv.any?
      case argv.first
      when "--root"
        argv.shift
        root = argv.shift
      when "--dry-run"
        argv.shift
        dry_run = true
      else
        warn "argumento desconocido: #{argv.first}"
        return [nil, {}, 64]
      end
    end
    options = { root: File.expand_path(root || File.expand_path("..", __dir__)), dry_run: dry_run }
    [cmd, options, 0]
  end

  def semver?(value)
    !coerce_semver(value).nil?
  end

  def coerce_semver(value)
    return nil if value.nil?

    text = value.to_s.strip
    text = text.delete_prefix('"').delete_suffix('"').delete_prefix("'").delete_suffix("'")
    return nil unless text.match?(SEMVER)

    text
  end

  def read_frontmatter(path)
    return nil unless File.file?(path)

    text = File.read(path)
    return nil unless text.start_with?("---\n")

    closing = text.index("\n---", 4)
    return nil unless closing

    YAML.safe_load(text[4...closing], permitted_classes: []) || {}
  rescue StandardError
    nil
  end

  def upstream(root)
    path = File.join(root, "vitals/config/dt-upstream.md")
    fm = read_frontmatter(path)
    return { mode: nil, framework_version: nil } unless fm.is_a?(Hash)

    mode = fm["mode"].to_s.strip.downcase
    mode = nil if mode.empty?
    {
      mode: mode,
      framework_version: coerce_semver(fm["framework_version"])
    }
  end

  def manifest(root)
    path = File.join(root, "vitals/config/project-version.yaml")
    return {} unless File.file?(path)

    data = YAML.safe_load(File.read(path), permitted_classes: [])
    data.is_a?(Hash) ? data : {}
  rescue StandardError
    {}
  end

  def version_file(root)
    path = File.join(root, "VERSION")
    return nil unless File.file?(path)

    coerce_semver(File.read(path))
  end

  def discover_rel_paths(root)
    rels = DISCOVER.select { |rel| File.file?(File.join(root, rel)) }
    Dir.glob(File.join(root, "apps/*/package.json")).sort.each do |abs|
      rels << abs.sub("#{root}/", "")
    end
    rels.uniq
  end

  def package_versions(root)
    versions = []
    discover_rel_paths(root).each do |rel|
      path = File.join(root, rel)
      begin
        data = JSON.parse(File.read(path))
        ver = coerce_semver(data["version"])
        next if ver.nil?

        versions << { "path" => rel, "version" => ver }
      rescue JSON::ParserError, Errno::ENOENT
        next
      end
    end
    versions
  end

  def product_package_versions(root, framework_version)
    package_versions(root).reject do |entry|
      framework_version && entry["version"] == framework_version
    end
  end

  def initial_semver(root)
    coerce_semver(manifest(root)["initial_semver"]) || INITIAL_DEFAULT
  end

  def choose_product(root)
    meta = upstream(root)
    fw = meta[:framework_version]
    current = version_file(root)

    # En canónico el producto es el DT: VERSION y framework_version coinciden a propósito.
    if meta[:mode] == "canonical"
      if current
        return ok_choice(current, "VERSION", "unchanged", meta, current)
      end

      return ok_choice(initial_semver(root), "initial_semver", "initial", meta, current)
    end

    pkgs = package_versions(root)
    product_pkgs = product_package_versions(root, fw)
    distinct = product_pkgs.map { |e| e["version"] }.uniq

    version_is_dt = !current.nil? && !fw.nil? && current == fw
    version_is_product = !current.nil? && !version_is_dt

    if version_is_product
      return ok_choice(current, "VERSION", "unchanged", meta, current)
    end

    root_pkg = product_pkgs.find { |e| e["path"] == "package.json" }
    if root_pkg
      action = current == root_pkg["version"] ? "unchanged" : "keep"
      return ok_choice(root_pkg["version"], "package.json", action, meta, current)
    end

    if distinct.size == 1
      chosen = distinct.first
      source = product_pkgs.first["path"]
      action = current == chosen ? "unchanged" : "keep"
      return ok_choice(chosen, source, action, meta, current)
    end

    if distinct.size > 1
      listed = product_pkgs.map { |e| "#{e['path']}=#{e['version']}" }.join(" ")
      return {
        error: 2,
        message: "versiones de producto en conflicto (#{listed}). Elegí una en VERSION. Nunca uses framework_version #{fw || '(DT)'}.",
        mode: meta[:mode],
        framework_version: fw,
        current: current,
        packages: pkgs
      }
    end

    # Sin semver de producto: proyecto nuevo, o VERSION era la del DT.
    chosen = initial_semver(root)
    source = "initial_semver"
    action = if current == chosen
               version_is_dt ? "initial" : "unchanged"
             else
               "initial"
             end
    ok_choice(chosen, source, action, meta, current)
  end

  def ok_choice(product, source, action, meta, current)
    {
      error: nil,
      mode: meta[:mode],
      framework_version: meta[:framework_version],
      product_version: product,
      source: source,
      action: action,
      wrote: false,
      current: current
    }
  end

  def resolve!(root, dry_run: false)
    choice = choose_product(root)
    return choice if choice[:error]

    target = File.join(root, "VERSION")
    need_write = choice[:current] != choice[:product_version]
    if need_write && !dry_run
      File.write(target, "#{choice[:product_version]}\n")
    end
    choice.merge(wrote: need_write)
  end

  def guard!(root)
    meta = upstream(root)
    return { error: nil, skip: true } unless meta[:mode] == "consumer"

    fw = meta[:framework_version]
    current = version_file(root)
    product_pkgs = product_package_versions(root, fw)

    if current && fw && current == fw
      extra = if product_pkgs.any?
                " El producto ya tiene #{product_pkgs.map { |e| "#{e['path']}=#{e['version']}" }.join(', ')}."
              else
                " Si el proyecto es nuevo, resolvé a #{initial_semver(root)}."
              end
      return {
        error: 3,
        message: "VERSION=#{current} coincide con framework_version del DT.#{extra} Corré ./scripts/project-resolve-version.sh. Nunca copies el semver del DT al producto."
      }
    end

    { error: nil, skip: false, version: current, framework_version: fw }
  end

  def consumer_sync_forbidden?(entry, mode)
    return false unless mode == "consumer"

    field = (entry["field"] || "version").to_s
    type = entry["type"].to_s
    type == "yaml_frontmatter" && field == "framework_version"
  end

  def doctor_findings(root)
    meta = upstream(root)
    return [] unless meta[:mode] == "consumer"

    fw = meta[:framework_version]
    current = version_file(root)
    product_pkgs = product_package_versions(root, fw)
    findings = []

    if current && fw && current == fw
      if product_pkgs.any?
        listed = product_pkgs.map { |e| "#{e['path']}=#{e['version']}" }.join(", ")
        findings << [:error, "VERSION=#{current} es el semver del DT; el producto ya tiene #{listed}. /guardar no debe copiar la versión del framework."]
      else
        findings << [:warn, "VERSION=#{current} coincide con framework_version. En consumer eso suele ser el DT copiado. Resolvé con project-resolve-version.sh (nuevo → #{initial_semver(root)})."]
      end
    end

    findings
  end

  def print_resolve(choice)
    puts "DT_VERSION_MODE=#{choice[:mode] || ""}"
    puts "DT_FRAMEWORK_VERSION=#{choice[:framework_version] || ""}"
    puts "DT_PRODUCT_VERSION=#{choice[:product_version]}"
    puts "DT_VERSION_SOURCE=#{choice[:source]}"
    puts "DT_VERSION_ACTION=#{choice[:action]}"
    puts "DT_VERSION_WROTE=#{choice[:wrote] ? 1 : 0}"
    fw = choice[:framework_version] || "n/a"
    discarded_dt = choice[:current] && choice[:framework_version] && choice[:current] == choice[:framework_version]
    human =
      case choice[:action]
      when "initial"
        if discarded_dt
          "VERSION #{choice[:current]} era la del DT; no se copia. Proyecto nuevo → #{choice[:product_version]}."
        else
          "Proyecto sin semver propio: VERSION=#{choice[:product_version]} (#{choice[:source]}). Framework DT #{fw} no se copia."
        end
      when "keep"
        "Se conserva el semver del producto #{choice[:product_version]} (#{choice[:source]}). Framework DT #{fw} no se toca."
      else
        "VERSION del producto #{choice[:product_version]} ya era la correcta. Framework DT #{fw} no se toca."
      end
    puts human
  end
end

if $PROGRAM_NAME == __FILE__
  cmd, options, status = DtProjectVersion.parse_args(ARGV.dup)
  exit status if status != 0

  unless %w[resolve guard doctor].include?(cmd)
    warn "Uso: project-version.rb resolve|guard|doctor [--root DIR] [--dry-run]"
    exit 64
  end

  root = options[:root]
  case cmd
  when "resolve"
    choice = DtProjectVersion.resolve!(root, dry_run: options[:dry_run])
    if choice[:error]
      warn "ERROR: #{choice[:message]}"
      exit choice[:error]
    end
    DtProjectVersion.print_resolve(choice)
    exit 0
  when "guard"
    result = DtProjectVersion.guard!(root)
    if result[:error]
      warn "ERROR: #{result[:message]}"
      puts "DT_VERSION_GUARD=fail"
      exit result[:error]
    end
    puts "DT_VERSION_GUARD=ok"
    exit 0
  when "doctor"
    findings = DtProjectVersion.doctor_findings(root)
    findings.each do |level, msg|
      puts "#{level}:#{msg}"
    end
    exit 0
  end
end
