---
id: DOC-GUIDE-007
title: Actualizar el framework DT desde upstream
type: guide
status: canonical
owner: dt-platform
created: 2026-06-25
updated: 2026-06-25
tags:
  - upstream
  - actualizar-dt
  - git
  - framework
domain:
  - meta
summary: Cómo detectar y aplicar releases del template El DT en un repo consumidor vía skills Markdown (/actualizar Fase B, /actualizar-dt).
related:
  - DOC-GUIDE-003
  - DOC-GUIDE-004
  - DOC-GUIDE-006
  - DOC-OV-004
keywords:
  - dt-upstream
  - framework_version
  - actualizar-dt
priority: high
intended_audience:
  - engineers
  - ai-agents
source_of_truth: true
review_cycle_days: 90
---

# Actualizar el framework DT desde upstream

## Summary

En un **repo consumidor**, **`/actualizar`** sincroniza `origin` y la IA **consulta** releases DT siguiendo Markdown (`git-actualizar`). **`/actualizar-dt`** aplica el update con dry-run Git + confirmación (`dt-actualizar`).

**No hay scripts Ruby de sync** — solo instrucciones `.md` que la IA ejecuta.

## Purpose

Mantener normativa DT al día sin mezclar el pull diario del producto con merge riesgoso del framework.

## Fuentes canónicas (Markdown)

| Artefacto | Path |
|-----------|------|
| Spec config | [`vitals/specs/dt-upstream-config.md`](../../vitals/specs/dt-upstream-config.md) |
| Plantilla config | [`vitals/config/dt-upstream.example.md`](../../vitals/config/dt-upstream.example.md) |
| Fase B consulta | [`.cursor/skills/git-actualizar/references/upstream-check.md`](../../.cursor/skills/git-actualizar/references/upstream-check.md) |
| Apply + paths | [`.cursor/skills/dt-actualizar/references/sync-from-upstream.md`](../../.cursor/skills/dt-actualizar/references/sync-from-upstream.md) · [`sync-paths.md`](../../.cursor/skills/dt-actualizar/references/sync-paths.md) |
| Skills | `git-actualizar`, `dt-actualizar` |

## Configuración

1. Copiá `vitals/config/dt-upstream.example.md` → **`vitals/config/dt-upstream.md`**
2. `git remote add dt-upstream <url-repo-canónico>`
3. Tras **`/bootstrap`**, `framework_version` vive en el frontmatter del `.md` (no en `VERSION` raíz del proyecto)
4. `preserve_paths` en frontmatter para docs de producto
5. Estado local: `vitals/ops/dt-upstream-state.md` (gitignored; plantilla `.example.md`)

## Ritual — `/actualizar`

| Fase | Skill / referencia |
|------|-------------------|
| **A** | `git fetch` + `git pull --rebase` de `origin` |
| **B** | [`upstream-check.md`](../../.cursor/skills/git-actualizar/references/upstream-check.md) — semver vs tags; avisar → `/actualizar-dt` |

## Apply — `/actualizar-dt`

Seguir [`sync-from-upstream.md`](../../.cursor/skills/dt-actualizar/references/sync-from-upstream.md): dry-run con `git diff`, confirmación, `git checkout dt-upstream/vX.Y.Z -- <paths>`, post-sync, **`/guardar`**.

## Validación

`./scripts/dt-doctor.sh` (verificador del repo; no ejecuta el sync upstream).

## Related docs

- [Adoptar El DT en un repo existente](adopt-dt-in-existing-repo.md) (`DOC-GUIDE-003`)
- [Usar El DT como base / bootstrap](usar-dt-como-base.md) (`DOC-GUIDE-004`)
- [Cerebro del equipo](../00_overview/cerebro-equipo-mecanismos-dt.md) (`DOC-OV-004`)
