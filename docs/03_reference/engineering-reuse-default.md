---
id: DOC-REF-006
title: Ingeniería reuse-first del DT
type: reference
status: canonical
owner: dt-platform
created: 2026-06-23
updated: 2026-06-19
tags:
  - engineering
  - reuse
  - patterns
  - best-practices
domain:
  - reference
summary: Jerarquía de reutilización, pipeline discover-before-create y entregable obligatorio para agentes que escriben código.
related:
  - DOC-REF-005
  - DOC-META-001
priority: high
intended_audience:
  - engineers
  - ai-agents
source_of_truth: true
review_cycle_days: 90
---

# Ingeniería reuse-first del DT

Referencia humana del mandato **reuse-first** para todo agente que proponga o escriba código ejecutable. Fuente machine-readable: regla `15-engineering-reuse` · skill `.cursor/skills/engineering-reuse/`.

Complementa el stack web ([`DOC-REF-005`](web-stack-default.md)): el stack dice *con qué* construir; reuse-first dice *cómo* construir sin duplicar.

## Jerarquía de reutilización

| Prioridad | Acción |
|-----------|--------|
| 1 | Extender código existente del repo |
| 2 | Usar design system o librería ya adoptada |
| 3 | Componer desde primitivas del framework |
| 4 | Crear nuevo (documentar por qué) |

## Pipeline pre-código

```text
Mapear → Reutilizar → Extender → Crear
```

1. **Mapear** — buscar handlers, componentes, hooks, workflows, fixtures relacionados.
2. **Reutilizar** — importar o parametrizar lo encontrado.
3. **Extender** — diff mínimo sobre módulos existentes.
4. **Crear** — solo si no hay alternativa; explicar qué buscaste.

## Reglas derivadas

- **Discover before create** — búsqueda en repo antes de archivos nuevos.
- **Minimal diff** — extender > refactorizar > reescribir.
- **YAGNI** — abstraer desde la tercera repetición real, no antes.

## Entregable obligatorio

Toda entrega con código incluye:

```markdown
## Qué reutilicé
## Qué creé y por qué
```

Plantilla: `.cursor/skills/engineering-reuse/references/deliverable-template.md`.

## Agentes afectados

| Agente | Qué reutiliza |
|--------|----------------|
| arquitecto | services, repos, handlers, reglas Firestore, ADRs |
| frontend | componentes, hooks, tokens Atelier |
| devops | workflows CI, scripts deploy, módulos IaC |
| qa | fixtures, factories, helpers de test |
| remotion-producer | `tools/remotion/primitives/`, composiciones del proyecto, assets `public/` |

## Delegación desde el DT

Al invocar agentes de código, incluir **Bloque ingeniería reuse** (ver regla `03-catalogo-subagentes`):

```text
Bloque ingeniería reuse:
- Skill: engineering-reuse (leer discover-before-create)
- Jerarquía: repo existente > design system > framework > nuevo
- Entregar sección "Qué reutilicé"
- Diff mínimo; YAGNI
```

## Fuentes canónicas

| Artefacto | Ubicación |
|-----------|-----------|
| Regla always-on | `vitals/specs/rule-bodies/15-engineering-reuse.body.md` |
| Skill táctica | `.cursor/skills/engineering-reuse/SKILL.md` |
| Checklist discover | `.cursor/skills/engineering-reuse/references/discover-before-create.md` |
| Anti-patterns | `.cursor/skills/engineering-reuse/references/anti-patterns.md` |
| Tools registry | [`tools/REGISTRY.md`](../../tools/REGISTRY.md) · [`tools-registry.md`](tools-registry.md) (`DOC-REF-007`) |

## Related docs

- [Stack web default](web-stack-default.md) (`DOC-REF-005`)
- [Protocolo documentación IA](../99_meta/protocolo-documentacion-ia.md) (`DOC-META-001`)
