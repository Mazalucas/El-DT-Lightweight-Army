---
id: DOC-REF-005
title: Stack web canónico del DT (Firebase + Node)
type: reference
status: canonical
owner: dt-platform
created: 2026-06-23
updated: 2026-06-23
tags:
  - engineering
  - stack
  - firebase
  - node
domain:
  - reference
summary: Stack web default del DT — Node + Firebase completo, Vite + React en frontend; soft default que respeta repos existentes.
related:
  - DOC-REF-002
priority: high
intended_audience:
  - engineers
  - ai-agents
source_of_truth: true
review_cycle_days: 90
---

# Stack web canónico del DT

Referencia humana del stack que el DT propone por defecto en **desarrollo web**. Fuente machine-readable: [`vitals/data/engineering/web-stack.yaml`](../../vitals/data/engineering/web-stack.yaml). Regla del orquestador: `.cursor/rules/08-stack-web-default.mdc`.

## Modo: soft default

El DT **recomienda fuerte** Node + Firebase en proyectos nuevos o sin stack claro. **No empuja migración** si el repo ya usa otro stack (Python, Postgres, etc.).

## Precedencia

1. Opt-out explícito del usuario
2. Stack detectado en el repo (`firebase.json`, `package.json`, etc.)
3. [`.agents/engineering-stack.md`](../../.agents/engineering-stack.md.example) (local, por proyecto)
4. Default en `web-stack.yaml`

Detalle: [`vitals/specs/precedence.md`](../../vitals/specs/precedence.md).

## Stack default

| Capa | Tecnología |
|------|------------|
| Runtime | Node.js LTS |
| Auth | Firebase Auth |
| Base de datos | Firestore |
| Backend/API | Cloud Functions for Firebase (Node) |
| Hosting | Firebase Hosting / App Hosting |
| Archivos | Cloud Storage |
| Secrets | Firebase Secrets |
| Frontend | Vite + React (Firebase JS SDK v9+) |

## Escalation path

| Caso | Camino |
|------|--------|
| Workers pesados, APIs largas | Cloud Run + Firestore |
| SQL relacional estricto | Solo con opt-out explícito |

## Excepciones

- **Atelier ecosystem lock** (Shopify, Atlassian, Microsoft): UI lock-in prevalece
- **Remotion**: video programático; no exige backend Firebase

## Propagación a subagentes

El DT incluye un **bloque stack** al delegar a `arquitecto`, `frontend`, `devops`, `srd-creator`, `development-planner`. Ver regla `03-catalogo-subagentes` ítem 4 de delegación.

## Override local

Copiar [`.agents/engineering-stack.md.example`](../../.agents/engineering-stack.md.example) a `.agents/engineering-stack.md` y ajustar por proyecto.

## Archivos relacionados

| Archivo | Rol |
|---------|-----|
| `vitals/data/engineering/web-stack.yaml` | Fuente de verdad (datos) |
| `vitals/specs/rule-bodies/08-stack-web-default.body.md` | Comportamiento del orquestador |
| `vitals/specs/rule-bodies/10-arquitectura-backend.body.md` | Convenciones backend |
| `vitals/specs/rule-bodies/20-frontend-ui.body.md` | Convenciones frontend |
| `docs/03_reference/engineering-reuse-default.md` (`DOC-REF-006`) | Reuse-first al implementar |
| `vitals/specs/rule-bodies/15-engineering-reuse.body.md` | Regla reuse always-on |
