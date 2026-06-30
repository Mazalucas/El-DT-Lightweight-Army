---
id: DOC-DEC-003
title: ADR-003 — Atelier design intelligence nativo
type: decision
status: accepted
owner: dt-platform
created: 2026-06-13
updated: 2026-06-13
tags:
  - adr
  - design
  - atelier
summary: Decisión de implementar Atelier como pack nativo con retrieval por capas, contexto unificado y dependencias externas opcionales.
related:
  - DOC-DESIGN-001
  - DOC-ARCH-002
priority: high
source_of_truth: true
---

# ADR-003: Atelier design intelligence nativo

## Contexto

El DT necesitaba criterio estético reutilizable, anti-slop y selección inteligente de design systems sin copiar repos externos ni llenar contexto. Referencias: ui-ux-pro-max, Impeccable, taste-skill, 21st.dev.

## Decisión

1. **Pack nativo** `.cursor/skills/design/` orquestado por **ui-designer** (paralelo a marketing-strategist).
2. **Contexto unificado** `.agents/design-context.md` (absorbe product-marketing si existe).
3. **Motor Ruby** `dt-design-select.rb` + datos en `vitals/data/design/` — no Python obligatorio.
4. **Detect bash** `dt-design-detect.sh` — reglas determinísticas sin LLM.
5. **Command** `/atelier` con subcomandos vía skill router.
6. **21st.dev MCP** — opcional, documentado, sin API keys en repo.

## Consecuencias

- Pros: paridad multi-IDE, dt-doctor, extensible por YAML, contexto acotado
- Contras: mantener datos/industrias; no paridad 1:1 con uupm 161 reglas en v1

## Alternativas rechazadas

- Vendor `uipro-cli` como dependencia obligatoria
- SKILL monolítico taste-skill (84KB en contexto)
- Duplicar PRODUCT.md + DESIGN.md (Impeccable) separados del marketing DT
