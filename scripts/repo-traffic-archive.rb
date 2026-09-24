#!/usr/bin/env ruby
# frozen_string_literal: true

# Archiva el tráfico de GitHub (ventana de 14 días) en la rama analytics.
# Cada corrida pisa la misma fecha: los días que se solapan no se suman dos veces.
# Los uniques son por día; no se acumulan.
#
# Requiere TRAFFIC_TOKEN (PAT fino, Administration: Read en este repo).
# El push usa las credenciales del checkout (GITHUB_TOKEN en Actions).
#
# Uso: TRAFFIC_TOKEN=... ruby scripts/repo-traffic-archive.rb
#      ruby scripts/repo-traffic-archive.rb --self-check

require "json"
require "open3"
require "time"

ROOT = File.expand_path("..", __dir__)

def self_check
  existing = { "days" => { "2026-09-10" => { "count" => 1, "uniques" => 1 } } }
  incoming = {
    "clones" => [
      { "timestamp" => "2026-09-10T00:00:00Z", "count" => 2, "uniques" => 1 },
      { "timestamp" => "2026-09-11T00:00:00Z", "count" => 4, "uniques" => 3 }
    ]
  }
  merged = upsert_traffic(existing, incoming, "clones")
  raise "no actualizó el día solapado" unless merged["days"]["2026-09-10"]["count"] == 2
  raise "no agregó el día nuevo" unless merged["days"]["2026-09-11"]["count"] == 4
  totals = series_totals(merged)
  raise "sumó uniques" unless totals["count"] == 6 && totals["days"] == 2
  puts "self-check ok"
end

def upsert_traffic(existing, payload, key)
  days = existing.fetch("days", {}).dup
  Array(payload[key]).each do |row|
    date = row.fetch("timestamp")[0, 10]
    days[date] = { "count" => row.fetch("count"), "uniques" => row.fetch("uniques") }
  end
  { "days" => days.sort.to_h }
end

def upsert_repo(existing, date, repo_payload)
  days = existing.fetch("days", {}).dup
  days[date] = {
    "stars" => repo_payload.fetch("stargazers_count"),
    "forks" => repo_payload.fetch("forks_count"),
    "watchers" => repo_payload.fetch("subscribers_count")
  }
  { "days" => days.sort.to_h }
end

def series_totals(series)
  days = series.fetch("days")
  {
    "count" => days.values.sum { |row| row.fetch("count") },
    "days" => days.length
  }
end

def write_json(path, obj)
  File.write(path, JSON.pretty_generate(obj) + "\n")
end

def read_json(path)
  return {} unless File.file?(path)

  JSON.parse(File.read(path))
end

def gh_json(path, token)
  stdout, stderr, status = Open3.capture3({ "GH_TOKEN" => token }, "gh", "api", path)
  raise "gh api #{path} falló: #{stderr.strip}" unless status.success?

  JSON.parse(stdout)
end

def git(*args)
  stdout, stderr, status = Open3.capture3("git", "-C", ROOT, *args)
  raise "git #{args.join(" ")} falló: #{stderr.strip}" unless status.success?

  stdout
end

def capture_archive(token, repo, today)
  clones = gh_json("repos/#{repo}/traffic/clones", token)
  views = gh_json("repos/#{repo}/traffic/views", token)
  referrers = gh_json("repos/#{repo}/traffic/popular/referrers", token)
  paths = gh_json("repos/#{repo}/traffic/popular/paths", token)
  meta = gh_json("repos/#{repo}", token)
  {
    "clones" => clones,
    "views" => views,
    "referrers" => referrers,
    "paths" => paths,
    "meta" => meta,
    "today" => today
  }
end

def publish(archive, repo)
  remote = git("ls-remote", "--heads", "origin", "analytics")
  wt = File.join(Dir.tmpdir, "dt-traffic-#{Process.pid}")
  FileUtils.rm_rf(wt)
  if remote.strip.empty?
    git("worktree", "add", "--detach", wt, "HEAD")
    git_wt("checkout", "--orphan", "analytics", dir: wt)
    git_wt("rm", "-rf", "--quiet", ".", dir: wt)
  else
    git("fetch", "origin", "analytics")
    git("worktree", "add", "--track", "-b", "analytics", wt, "origin/analytics")
  end

  clones = upsert_traffic(read_json(File.join(wt, "series", "clones.json")), archive["clones"], "clones")
  views = upsert_traffic(read_json(File.join(wt, "series", "views.json")), archive["views"], "views")
  repo_series = upsert_repo(read_json(File.join(wt, "series", "repo.json")), archive["today"], archive["meta"])

  FileUtils.mkdir_p(File.join(wt, "series"))
  FileUtils.mkdir_p(File.join(wt, "snapshots", archive["today"]))
  write_json(File.join(wt, "series", "clones.json"), clones)
  write_json(File.join(wt, "series", "views.json"), views)
  write_json(File.join(wt, "series", "repo.json"), repo_series)
  write_json(File.join(wt, "snapshots", archive["today"], "referrers.json"), archive["referrers"])
  write_json(File.join(wt, "snapshots", archive["today"], "paths.json"), archive["paths"])
  write_json(File.join(wt, "summary.json"), summary_for(repo, archive["today"], clones, views, repo_series))
  File.write(File.join(wt, "README.md"), readme)

  git_wt("add", "-A", dir: wt)
  _out, _err, status = Open3.capture3("git", "-C", wt, "diff", "--cached", "--quiet")
  if status.success?
    puts "sin cambios para commitear"
    return
  end

  commit = ["commit", "-m", "traffic: #{archive["today"]}"]
  if ENV["GITHUB_ACTIONS"] == "true"
    commit = ["-c", "user.name=github-actions[bot]", "-c", "user.email=41898282+github-actions[bot]@users.noreply.github.com", *commit]
  end
  git_wt(*commit, dir: wt)
  git_wt("push", "-u", "origin", "analytics", dir: wt)
  puts "analytics actualizado (#{archive["today"]})"
ensure
  if wt && File.directory?(wt)
    Open3.capture3("git", "-C", ROOT, "worktree", "remove", "--force", wt)
  end
end

def git_wt(*args, dir:)
  stdout, stderr, status = Open3.capture3("git", "-C", dir, *args)
  raise "git #{args.join(" ")} falló: #{stderr.strip}" unless status.success?

  stdout
end

def summary_for(repo, today, clones, views, repo_series)
  latest = repo_series.fetch("days")[today] || {}
  {
    "repo" => repo,
    "updated_at" => today,
    "note" => "count suma los días archivados. uniques no se suman: son por día, en series/*.json.",
    "clones" => series_totals(clones),
    "views" => series_totals(views),
    "latest" => latest.merge("date" => today)
  }
end

def readme
  <<~MD
    # Tráfico del repositorio

    Histórico armado por `.github/workflows/repo-traffic.yml`. GitHub solo conserva 14 días; esta rama guarda cada día una vez.

    - `series/clones.json` y `series/views.json`: un registro por fecha (`count` y `uniques`).
    - `series/repo.json`: estrellas, forks y watchers de cada día.
    - `snapshots/YYYY-MM-DD/`: referrers y páginas de esa ventana de 14 días.
    - `summary.json`: totales de `count`. Los `uniques` no se suman entre días.

    Una misma fecha se reemplaza si el workflow corre de nuevo. No se duplica.
  MD
end

if ARGV.include?("--self-check")
  self_check
  exit 0
end

require "fileutils"
require "tmpdir"

token = ENV["TRAFFIC_TOKEN"].to_s
repo = ENV["REPO"].to_s
repo = ENV["GITHUB_REPOSITORY"].to_s if repo.empty?
if token.empty?
  warn "Falta TRAFFIC_TOKEN."
  warn "Creá un PAT fino con Administration: Read solo en este repo:"
  warn "https://github.com/settings/personal-access-tokens/new"
  warn "Guardalo como secreto del repo con el nombre TRAFFIC_TOKEN."
  exit 1
end
if repo.empty?
  warn "Falta REPO (owner/nombre)."
  exit 1
end

today = Time.now.utc.strftime("%Y-%m-%d")
publish(capture_archive(token, repo, today), repo)
