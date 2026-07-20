---
id: DOC-DEC-005
title: "ADR-005: Optimización de contexto — reglas condicionales y skills tácticas"
type: decision
status: canonical
owner: dt-platform
created: 2026-07-20
updated: 2026-07-20
tags:
  - adr
  - context
  - tokens
  - rules
domain:
  - meta
summary: Reducir costo fijo de contexto del DT con alwaysApply condicional, cuerpos de reglas adelgazados, AGENTS.md mínimo y guías tácticas design/marketing fuera del registro de skills.
related:
  - DOC-DEC-002
  - DOC-OV-004
keywords:
  - context window
  - alwaysApply
  - GUIDE.md
priority: high
intended_audience:
  - engineers
  - ai-agents
source_of_truth: true
review_cycle_days: 180
---

# ADR-005: Optimización de contexto — reglas condicionales y skills tácticas

## Contexto

Cada conversación cargaba ~50 KB de reglas always-apply y 105 entradas `SKILL.md`, duplicando catálogos y rituales. Eso llenaba la ventana de contexto antes del primer mensaje del usuario y multiplicaba tokens en delegaciones.

## Decisión

1. **Reglas condicionales:** solo `00-orquestador-core`, `01-protocolos-dt`, `03-catalogo-subagentes` y `06-dt-colaboracion` permanecen `alwaysApply: true`. El resto de normativa transversal (`02`, `05`, `07`, `08`, `15`, `16`, `17`) pasa a carga por `description`.
2. **Deduplicación:** eliminar regla `04-recomendacion-herramientas` (contenido absorbido en `00`); adelgazar cuerpos `00`, `03`, `07`, `17`; `AGENTS.md` como índice de punteros.
3. **Skills tácticas:** bajo `.cursor/skills/design/` y `.cursor/skills/marketing/`, renombrar `SKILL.md` → `GUIDE.md` para no registrar 72 sub-skills en cada turno; orquestadores (`atelier`, `marketing-strategist`) siguen con `SKILL.md`.
4. **Orden continuo:** por defecto **una pasada** de `dt-doctor` por entrega; loop iterativo solo a pedido.

Fuentes canónicas: `vitals/config/rules-manifest.yaml`, `vitals/specs/rule-bodies/`, `.cursor/skills/`. Regenerar espejos con `./scripts/sync-ide.sh`.

## Consecuencias

- **Pros:** menor costo fijo estimado ~70% en bytes always-apply; menos ruido en delegaciones.
- **Contras:** dependencia de que el modelo cargue reglas condicionales a tiempo; guías tácticas ya no invocables como skill de primer nivel (solo vía orquestador o lectura explícita de `GUIDE.md`).
- **Mitigación:** índice de reglas condicionales en `00`; smoke tests en escenarios docs/web/números; `dt-doctor` valida guías Atelier requeridas.
