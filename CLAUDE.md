# CLAUDE.md

> Puntero generado por `scripts/sync-ide`. No editar a mano.

Este proyecto usa **El DT**. La fuente canónica de instrucciones para agentes es
**[AGENTS.md](AGENTS.md)** — leelo primero.

## Específicos de Claude Code

- Reglas: `.claude/rules/`
- Commands: `.claude/commands/`
- Skills: `.claude/skills/`
- Subagentes: `.claude/agents/`
- Settings: `.claude/settings.json`

Reglas, skills y commands se **generan** desde fuentes únicas
(`vitals/specs/rule-bodies/`, `vitals/config/`, `.cursor/skills/`, `.cursor/commands/`).
No edites los destinos a mano: corré `./scripts/sync-ide.sh`.
