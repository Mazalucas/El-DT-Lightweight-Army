# Host locale can be C/US-ASCII (Claude Code, CI, Docker). Repo files are UTF-8.
# Source from any scripts/*.sh that invokes Ruby (covers heredocs and children).
# shellcheck shell=bash
case "${RUBYOPT:-}" in
  *-EUTF-8:UTF-8*) ;;
  *) export RUBYOPT="-EUTF-8:UTF-8${RUBYOPT:+ $RUBYOPT}" ;;
esac
