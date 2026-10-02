# frozen_string_literal: true

# Host locale can be C/US-ASCII (Claude Code, CI, Docker). Repo files are UTF-8.
# Require this before File.read / YAML on any Ruby entrypoint.
# Also exports RUBYOPT so child `ruby` processes (dt-doctor → sync-ide) inherit UTF-8.
Encoding.default_external = Encoding::UTF_8
Encoding.default_internal = Encoding::UTF_8

rubyopt = ENV["RUBYOPT"].to_s
unless rubyopt.include?("-EUTF-8:UTF-8")
  ENV["RUBYOPT"] = "-EUTF-8:UTF-8#{rubyopt.empty? ? "" : " #{rubyopt}"}"
end
