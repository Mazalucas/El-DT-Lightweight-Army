---
id: DOC-CONCEPT-001
title: "Vitals — telemetría y normativa del Director Técnico"
type: concept
status: canonical
owner: dt-platform
created: 2026-04-19
updated: 2026-04-19
tags:
  - vitals
  - dt
  - orchestration
  - pulse
domain:
  - meta
summary: Qué es la carpeta vitals/ en la plantilla DT, cómo se relaciona con docs/ y por qué prioriza recuperación de contexto sin inflar el chat.
related:
  - DOC-META-001
  - DOC-GUIDE-003
  - DOC-OV-001
keywords:
  - pulse
  - memory
  - multi-project
priority: high
intended_audience:
  - engineers
  - ai-agents
source_of_truth: true
review_cycle_days: 90
---

# Vitals — telemetría y normativa del DT

## Summary

**Vitals** es el sistema en la raíz del repo (`vitals/`) donde el Director Técnico registra **latidos** (`pulse`), **propuestas de memoria** (`memory/inbox` → `accepted` con opt-in) y **especificaciones canónicas** (`specs/`) compartidas entre Cursor y Antigravity. Complementa a `docs/`: `docs/` es conocimiento de producto y proyecto; **vitals/** es operación del orquestador y trazabilidad ligera.

## Purpose

- Maximizar **información útil por token** (mismo espíritu que DOC-META-001).
- Evitar cargar historial largo en el chat: **índice** (`vitals/INDEX.md`) y **puntero** (`vitals/pulse/current.md`).
- Unificar normativa duplicable entre IDEs vía `vitals/specs/rule-bodies/` y `scripts/sync-dt-from-vitals.sh`.

## Scope

**Cubre:** estructura de `vitals/`, pulse, memoria sugerida, precedencia fast-lane, multi-proyecto Git.

**No cubre:** sustituir ADRs en `docs/05_decisions/` ni secretos (prohibidos en vitals; ver `vitals/charter/no-secrets.md`).

## Conceptos clave

| Parte | Rol |
|-------|-----|
| `specs/` | Normativa canónica (precedencia, protocolo vitals, memoria, multi-proyecto, tooling proactivo) |
| `pulse/` | Entradas breves por evento; `current.md` es la puerta de entrada |
| `memory/` | Propuestas de patrones; promoción solo con aprobación humana |
| `charter/` | Reglas duras (p. ej. no secretos) |

## Related docs

- [Protocolo de documentación orientada a IA](../99_meta/protocolo-documentacion-ia.md) (`DOC-META-001`)
- [Adoptar El DT en un repo existente](../02_guides/adopt-dt-in-existing-repo.md) (`DOC-GUIDE-003`)
- Índice operativo: [`vitals/INDEX.md`](../../vitals/INDEX.md)
