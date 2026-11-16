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

## Reglas a pedido

No viven en `.claude/rules/`: leé la que corresponda **antes de actuar** cuando la tarea encaje con su descripción.

- `vitals/specs/rule-bodies/05-multi-project-git.body.md` — OBLIGATORIO si hay varios git roots o vitals/workspace.yaml — resolver project_id antes de Git o commits
- `vitals/specs/rule-bodies/08-stack-web-default.body.md` — OBLIGATORIO en desarrollo web, MVP, API o deploy — stack Node + Firebase soft default; bloque stack al delegar
- `vitals/specs/rule-bodies/17-canvas-first.body.md` — OBLIGATORIO en auditorías, planes grandes o análisis con tablas/charts — entregar en canvas del IDE si existe
- `vitals/specs/rule-bodies/16-numeric-grounding.body.md` — OBLIGATORIO con planillas, CSV, totales o reportes — calcular con script, etiquetas VERIFICADO/DERIVADO
