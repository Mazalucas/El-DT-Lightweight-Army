---
id: DOC-GUIDE-001
title: Configuración multi-IDE — Cursor, Antigravity, Claude, Codex, Copilot
type: guide
status: canonical
owner: dt-platform
created: 2026-04-19
updated: 2026-06-23
tags:
  - cursor
  - antigravity
  - claude
  - codex
  - copilot
  - setup
domain:
  - meta
summary: Registro multi-IDE, /bienvenida post-clone sin Ruby, y /setup repair para maintainers desde fuentes canónicas.
related:
  - DOC-OV-001
  - DOC-GUIDE-003
  - DOC-GUIDE-004
  - DOC-GUIDE-006
  - DOC-CONCEPT-001
  - DOC-DEC-001
keywords:
  - setup
  - ide-targets
  - sync-ide
  - dt-doctor
  - bienvenida
priority: high
intended_audience:
  - engineers
  - ai-agents
source_of_truth: true
review_cycle_days: 90
---

# Configuración multi-IDE

## Summary

El DT soporta **Cursor**, **Antigravity**, **Claude Code**, **Codex** y **GitHub Copilot**. Tras clonar, **`/bienvenida`** verifica la estructura (markdown, sin Ruby). **`/setup`** repara drift regenerando desde fuentes canónicas (requiere Ruby — maintainers).

## Purpose

Una sola fuente de verdad por artefacto; todos los IDEs enabled conviven sin borrar carpetas.

## Scope

**Cubre:** registro de IDEs, first-run post-clone, repair, verificación de orden.
**No cubre:** instalación de cada IDE ni cuentas.

## Registro de IDEs

El set soportado vive en **`vitals/config/ide-targets.yaml`**. Stubs: Gemini CLI y Windsurf (`enabled: false`).

| IDE | Entrada | Reglas | Skills | Notas |
|-----|---------|--------|--------|-------|
| Cursor | `.cursorrules` | `.cursor/rules/*.mdc` | `.cursor/skills/` (canónico) | Origen de skills |
| Antigravity | `.antigravity/rules.md` | `.agent/rules/*.md` | `.agent/skills/` | Commands en `.agent/workflows/` |
| Claude Code | `CLAUDE.md` (puntero) | `.claude/rules/*.md` | `.claude/skills/` | `.claude/{commands,agents,settings.json}` |
| Codex | `AGENTS.md` | — | `.agents/skills/` | Comandos = skills |
| GitHub Copilot | `.github/copilot-instructions.md` | — | — | Puntero a `AGENTS.md` |

## Post-clone: `/bienvenida`

Skill `dt-setup` (modo first-run). El clone **ya trae** rules, commands y skills en Git — no hace falta correr scripts.

Ver [primer-setup-dt.md](primer-setup-dt.md) (`DOC-GUIDE-006`).

## Repair: `/setup`

Cuando hay drift (pull grande, edición de fuentes canónicas, paridad rota):

```bash
./scripts/sync-ide.sh
./scripts/sync-commands-from-meta.sh
./scripts/sync-skills-parity.sh
ruby scripts/sync-catalog.rb
./scripts/dt-doctor.sh
```

Detalle: `.cursor/skills/dt-setup/references/post-sync-pipeline.md`

## `.cursorrules` y plantillas

Plantilla activa: **`docs/99_meta/cursorrules.dual.md`**. Las plantillas single-IDE (`cursorrules.cursor.md`, `cursorrules.antigravity.md`) están **deprecated**.

## Validación

Tras repair o edición de fuentes canónicas: **`./scripts/dt-doctor.sh`** en verde (regla `07-orden-continuo`).

## Fuentes canónicas → destinos

- **Reglas:** `vitals/specs/rule-bodies/` + `vitals/config/rules-manifest.yaml` → `./scripts/sync-ide.sh`
- **Commands:** `vitals/config/commands-meta.yaml` → `./scripts/sync-commands-from-meta.sh`
- **Skills:** `.cursor/skills/` → espejo vía `sync-skills-parity.sh` / `sync-ide.sh`

## Related docs

- [Primer setup post-clone](primer-setup-dt.md) (`DOC-GUIDE-006`)
- [Portal de documentación](../README.md) (`DOC-OV-001`)
- [Usar El DT como base de un proyecto](usar-dt-como-base.md) (`DOC-GUIDE-004`)
- [Adoptar El DT en un repo existente](adopt-dt-in-existing-repo.md) (`DOC-GUIDE-003`)
- [ADR: Convergencia AGENTS.md + Skills](../05_decisions/adr-001-convergencia-agents-skills.md) (`DOC-DEC-001`)
- [Vitals — concepto](../01_concepts/dt-vitals.md) (`DOC-CONCEPT-001`)
