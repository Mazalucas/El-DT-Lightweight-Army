---
description: Catálogo de subagentes - Qué existen y cuándo invocarlos
---

# Catálogo de Subagentes

Lista completa de subagentes (inspirados en Agents examples). Al delegar, incluye en el prompt del subagente el bloque de protocolos de `01-protocolos-dt.md`.

## Engineering

| Subagente | Cuándo invocar |
|-----------|----------------|
| **arquitecto** | backend, api, database, server, arquitectura, patrones |
| **frontend** | frontend, ui, ux, interface, client, componentes, accesibilidad |
| **devops** | deploy, infrastructure, ci/cd, devops, pipelines |
| **ui-designer** | UI design, mockups, design specs, design systems |

## Planning

| Subagente | Cuándo invocar |
|-----------|----------------|
| **prd-creator** | product idea, requirements, PRD |
| **srd-creator** | technical spec, SRD, PRD to technical |
| **development-planner** | development plan, phases, MVP, roadmap |

## Testing & Quality

| Subagente | Cuándo invocar |
|-----------|----------------|
| **qa** | test, qa, quality, pruebas, edge cases, validación |

## Design & UX

| Subagente | Cuándo invocar |
|-----------|----------------|
| **ux-researcher** | user research, personas, UX, journey mapping |

## Product & Research

| Subagente | Cuándo invocar |
|-----------|----------------|
| **product-strategist** | prioritization, roadmap, product strategy |
| **feedback-synthesizer** | feedback, synthesis, insights |
| **researcher** | research, analyze, investigate, información |

## Documentation

| Subagente | Cuándo invocar |
|-----------|----------------|
| **doc** | document, docs, readme, documentación |

## Marketing & Content

| Subagente | Cuándo invocar |
|-----------|----------------|
| **content-creator** | content, copy, marketing |
| **marketing-strategist** | marketing strategy, campaigns |
| **brand-guardian** | brand, brand compliance |
| **growth-hacker** | growth, experiments, conversion |
| **pitch-specialist** | pitch, presentation, investors |
| **storytelling-specialist** | storytelling, narrative, story |

## Operations

| Subagente | Cuándo invocar |
|-----------|----------------|
| **operations-maintainer** | operations, monitoring, incidentes |

## Lógica de mapeo (keywords en tarea)

- backend, api, database, server → **arquitecto**
- frontend, ui, ux, interface, client → **frontend** o **ui-designer**
- test, qa, quality → **qa**
- document, docs, readme → **doc**
- research, analyze, investigate → **researcher**
- deploy, infrastructure, ci/cd → **devops**
- product idea, PRD → **prd-creator**
- technical spec, SRD → **srd-creator**
- development plan, MVP → **development-planner**
- user research, personas → **ux-researcher**
- feedback, synthesis → **feedback-synthesizer**
- prioritization, roadmap → **product-strategist**
- content, copy → **content-creator**
- marketing strategy → **marketing-strategist**
- brand compliance → **brand-guardian**
- growth, experiments → **growth-hacker**
- pitch, investors → **pitch-specialist**
- storytelling, narrative → **storytelling-specialist**
- operations, monitoring → **operations-maintainer**

## Instrucción de delegación

Al invocar un subagente, incluye en tu prompt:
1. El contexto de la tarea
2. El bloque: "Aplica los protocolos DT: ordenar, cuestionar, proponer alternativas, incluir Puntos ciegos / Mejoras detectadas en tu entrega."
3. Qué formato de salida esperas
