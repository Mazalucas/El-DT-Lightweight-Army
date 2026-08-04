---
id: DOC-OPS-001
title: Colaboración Git en repos con El DT
type: runbook
status: canonical
owner: dt-platform
created: 2026-05-27
updated: 2026-05-27
tags:
  - git
  - collaboration
  - session
domain:
  - meta
summary: Zonas de escritura, conflictos y ritual actualizar → yo → guardar para equipos que comparten el cerebro DT.
related:
  - DOC-OV-004
  - DOC-GUIDE-003
keywords:
  - git
  - merge
  - session
priority: high
intended_audience:
  - engineers
  - ai-agents
source_of_truth: true
review_cycle_days: 90
---

# Colaboración Git — El DT

## Principio

Dos personas **no editan el mismo archivo** al mismo tiempo sin coordinar. La sesión local (`vitals/ops/session.yaml`) no va a Git; el roster sí.

## Zonas de escritura (template / framework)

| Zona | Path | Quién escribe | ¿Git? |
|------|------|---------------|-------|
| Pulse entries | `vitals/pulse/entries/` | Cualquier operador identificado | Sí |
| Pulse current | `vitals/pulse/current.md` | Coordinar entre editores | Sí (coordinar) |
| Docs canónicos | `docs/` | Quien toque el tema (coordinar) | Sí |
| Rules / commands / skills | `.cursor/`, `.agents/` | Platform / innovation | Sí |
| Cuaderno personal | `vitals/work/inbox/{operator_id}/` | Solo ese operador | Sí |
| Capturas `/ordenar` | `vitals/work/knowledge/` | Quien ejecuta `/ordenar` | Sí |
| Borradores | `vitals/work/inbox/**/draft-*` | Local | **NO** |
| Sesión | `vitals/ops/session.yaml` | Solo máquina local | **NO** |
| Workspace multi-repo | `vitals/workspace.yaml` | Solo máquina local | **NO** |

## Conflictos

1. **`docs/` o `vitals/pulse/current.md`:** hablar antes de mergear; preferir PR pequeños.
2. **Tras `git pull` con conflicto:** listar archivos; no usar `push --force` en `main`/`master`.
3. **Flujo:** `/actualizar` → resolver → `/guardar`.

## Related docs

- [Cerebro del equipo — mecanismos DT](../00_overview/cerebro-equipo-mecanismos-dt.md) (`DOC-OV-004`)
