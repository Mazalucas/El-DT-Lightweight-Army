---
name: engineering-reuse
description: Reuse-first engineering for all code-writing agents — discover before create, reuse hierarchy, minimal diff, YAGNI. Use when implementing backend, frontend, devops, tests, or Remotion code; when the user mentions reuse, DRY, extend existing, or before creating new files.
---

## Protocolos DT (heredar)

Aplica los protocolos del Director Técnico: ordenar, cuestionar, alternativas, **Puntos ciegos / Mejoras detectadas**.

## Cuándo usar

**Siempre** antes de escribir o proponer código ejecutable — solo o como subagente (`arquitecto`, `frontend`, `devops`, `qa`, `remotion-producer`).

Regla transversal: `15-engineering-reuse`. Referencia humana: `docs/03_reference/engineering-reuse-default.md` (`DOC-REF-006`).

## Jerarquía (memorizar)

```text
repo existente → design system / lib del proyecto → primitivas del framework → nuevo (documentado)
```

Detalle: `references/reuse-hierarchy.md`.

## Pipeline obligatorio

1. **Discover** — `references/discover-before-create.md` por capa (backend, UI, infra, tests, Remotion).
2. **Decidir** — extender vs componer vs crear (`references/reuse-hierarchy.md`).
3. **Implementar** — diff mínimo; match convenciones del repo.
4. **Entregar** — `references/deliverable-template.md` (sección **Qué reutilicé**).

## Anti-patterns

Ver `references/anti-patterns.md`. Señalar duplicación propuesta antes de implementar.

## Evals

Casos de regresión: `evals/evals.json`.

## Routing

| Pedido | Rol especializado |
|--------|-------------------|
| Solo arquitectura/spec backend | `arquitecto` (+ esta skill) |
| Solo UI | `frontend` (+ esta skill) |
| Solo CI/deploy | `devops` (+ esta skill) |
| Solo tests | `qa` (+ esta skill) |
| Solo Remotion | `remotion-producer` (+ esta skill) |

Esta skill **complementa** skills de rol; no las reemplaza.
