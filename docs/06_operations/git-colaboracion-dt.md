---
id: DOC-OPS-001
title: Colaboración Git en repos con El DT
type: runbook
status: canonical
owner: dt-platform
created: 2026-05-27
updated: 2026-09-23
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
| Perfil de contexto | `vitals/ops/context-profile.yaml` y `99-perfil-local` en las reglas de cada IDE | `/dt-config` en esa máquina | **NO** |
| Postura personal/team | `vitals/config/collaboration.yaml` | `/yo` (no `/bootstrap`) | **SÍ** |
| Checkout oficial | `vitals/ops/canonical-checkout.yaml` | Solo el dueño, con `/oficial` | **NO** |
| Workspace multi-repo | `vitals/workspace.yaml` | Solo máquina local | **NO** |

## Conflictos

1. **`docs/` o `vitals/pulse/current.md`:** hablar antes de mergear; preferir PR pequeños.
2. **Tras `git pull` con conflicto:** listar archivos; no usar `push --force` en `main`/`master`.
3. **Flujo:** `/actualizar` → resolver → `/guardar`.
4. **Remoto oficial del DT:** `/guardar` corre `./scripts/dt-publish-gate.sh` antes del bump. Sin `/oficial` en esta carpeta no hay push a ese remoto, y no se pide acceso. Otro proyecto arranca con `/bootstrap`. Spec: `vitals/specs/canonical-publish.md`.

## Related docs

- [Cerebro del equipo — mecanismos DT](../00_overview/cerebro-equipo-mecanismos-dt.md) (`DOC-OV-004`)
