---
id: DOC-DESIGN-001
title: Atelier — design intelligence en El DT
type: concept
status: canonical
owner: dt-platform
created: 2026-06-13
updated: 2026-06-13
tags:
  - design
  - atelier
  - ui
  - ux
summary: Qué es Atelier, capas de retrieval anti-contexto, y relación con ui-designer y frontend.
related:
  - DOC-GUIDE-005
  - DOC-REF-002
  - DOC-ARCH-002
  - DOC-DEC-003
priority: high
source_of_truth: true
---

# Atelier — design intelligence en El DT

**Atelier** es la capacidad nativa del DT para criterio estético, selección de design systems, anti-slop y templates reutilizables — sin inflar el contexto del agente.

## Dos capas

1. **Design systems** (Material, HIG, Fluent, Carbon, Polaris, Atlassian) — *cómo construir* interfaces completas.
2. **Lenguajes visuales** (Swiss, Bauhaus, minimalismo, neumorphism, glass) — *cómo se ve y se siente*.

## Retrieval en capas

| Capa | Ubicación |
|------|-----------|
| Índice | `.cursor/skills/design/README.md` |
| Contexto | `.agents/design-context.md` (local) |
| Motor | `ruby scripts/dt-design-select.rb` |
| Skill táctica | una por tarea bajo `design/` |
| Datos | `vitals/data/design/*.yaml` (solo scripts) |

## Roles

- **ui-designer** — orquestador Atelier (specs, no código)
- **frontend** — implementación
- **brand-guardian** — compliance de marca (`DEFER`)

## Inspiración (conceptos, no dependencias)

- [ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) — motor por industria
- [Impeccable](https://github.com/pbakaus/impeccable) — verbos y detect determinístico
- [taste-skill](https://github.com/Leonxlnx/taste-skill) — Design Read y dials
- [21st.dev](https://21st.dev/home) — variaciones de componentes (MCP opcional)

## Related docs

- [Guía de setup Atelier](../02_guides/atelier-setup.md) (`DOC-GUIDE-005`)
- [Matriz del selector](../03_reference/design-selector-matrix.md) (`DOC-REF-002`)
