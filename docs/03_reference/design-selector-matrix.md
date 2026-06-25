---
id: DOC-REF-002
title: Matriz del selector Atelier
type: reference
status: canonical
owner: dt-platform
created: 2026-06-13
updated: 2026-06-13
tags:
  - design
  - reference
  - selector
summary: Precedencia del motor dt-design-select y fuentes de datos en vitals/data/design/.
related:
  - DOC-DESIGN-001
  - DOC-GUIDE-005
priority: high
source_of_truth: true
---

# Matriz del selector Atelier

## Precedencia

1. **Ecosystem lock-in** — `vitals/data/design/decision-matrix.yaml` → Shopify/Polaris, Atlassian, Microsoft/Fluent, iOS/HIG, Android/Material
2. **Industria** — `industries.yaml` (match por señales en brief + design-context)
3. **Superficie** — brand (landing) vs product (dashboard)
4. **A11y estricto** — excluye neumorphism/glass full en gov/health/fintech
5. **Anti-defaults** — lista global + por industria

## Archivos de datos

| Archivo | Contenido |
|---------|-----------|
| `decision-matrix.yaml` | Lock-in, surface types, a11y |
| `industries.yaml` | Reglas por tipo de producto |
| `styles.yaml` | Estilos y slop risk |
| `template-registry.yaml` | Templates por estilo visual (paths, cuotas) |
| `palettes.yaml` | Paletas y pares tipográficos |
| `stacks.yaml` | Guías por stack |

## CLI

```bash
ruby scripts/dt-design-select.rb "BRIEF" [--product NAME] [--format markdown] [--context PATH]
```

## Overrides por página (opcional)

`.agents/design-system/MASTER.md` + `.agents/design-system/pages/{page}.md` — reglas de página sobre master.
