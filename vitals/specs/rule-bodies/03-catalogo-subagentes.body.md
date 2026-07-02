# Catálogo de Subagentes

Lista completa de subagentes (inspirados en Agents examples). Al delegar, incluye en el prompt del subagente el bloque de protocolos de `01-protocolos-dt.mdc`.

## Engineering

| Subagente | Cuándo invocar |
|-----------|----------------|
| **arquitecto** | backend, api, database, server, arquitectura, patrones |
| **frontend** | frontend, ui, ux, interface, client, componentes, accesibilidad |
| **devops** | deploy, infrastructure, ci/cd, devops, pipelines |
| **ui-designer** | UI design, mockups, design specs, design systems — orquestador **Atelier** (+30 skills en `.cursor/skills/design/`) |
| **remotion-producer** | Video programático con Remotion — composiciones React, motion, render (+ skill vendor `remotion-best-practices`) |

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
| **data-auditor** | planilla, spreadsheet, csv, excel, reporte, números, totales, reconciliar, verificar cifras — regla `16-numeric-grounding`, command `/verificar` |

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
| **marketing-strategist** | marketing strategy, campaigns, CRO, SEO, ads, copy, growth — 42 skills en `.cursor/skills/marketing/` |
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
- landing, dashboard, mockup, design system, estética, atelier → **ui-designer** (+ `/atelier`)
- remotion, video programático, motion graphics, composiciones, render MP4, npx remotion → **remotion-producer** (+ `/remotion`)
- test, qa, quality → **qa**
- planilla, spreadsheet, csv, excel, reporte, números, totales, reconciliar → **data-auditor** (+ `/verificar`)
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
2. El bloque: "Aplica los protocolos DT: ordenar, cuestionar, proponer alternativas, incluir **Contexto consultado** (fuentes que informaron tus decisiones, 1–3 líneas; en código lo cubre 'Qué reutilicé') y Puntos ciegos / Mejoras detectadas en tu entrega."
3. Qué formato de salida esperas
4. **Bloque stack web** (cuando la tarea sea desarrollo web): stack objetivo o detectado en repo; productos Firebase concretos (Auth, Firestore, Functions, Hosting, Storage); frontend default Vite + React. Fuente: `vitals/data/engineering/web-stack.yaml` y regla `08-stack-web-default`.
5. **Bloque ingeniería reuse** (cuando el subagente escriba o proponga código: `arquitecto`, `frontend`, `devops`, `qa`, `remotion-producer`):

```text
Bloque ingeniería reuse:
- Skill: engineering-reuse (leer discover-before-create)
- Jerarquía: repo existente > design system > framework > nuevo
- Entregar sección "Qué reutilicé"
- Diff mínimo; YAGNI
```

Fuente: regla `15-engineering-reuse` · `docs/03_reference/engineering-reuse-default.md` (`DOC-REF-006`).

6. **Bloque verificación numérica** (cuando la tarea involucre cifras derivadas de datos: `data-auditor`, `qa`, `arquitecto`, `researcher`, `marketing-strategist`):

```text
Bloque verificación numérica:
- Regla: 16-numeric-grounding (nunca calcular mentalmente)
- Todo cálculo con script ejecutado; etiquetas [VERIFICADO]/[DERIVADO]/[NO VERIFICADO]
- Cross-checks: total vs partes, conteo de filas, unidades
- Entregar sección "Verificación numérica"
```

Fuente: regla `16-numeric-grounding` · skill `data-auditor` · `docs/03_reference/numeric-verification-default.md` (`DOC-REF-009`).

## Un mensaje, varios agentes

Si el usuario mezcla varios pedidos en un solo mensaje, cada especialista debe **aportar solo lo que corresponde a su rol**; para partes fuera de alcance usar una línea `DEFER: <rol>` sin inventar. Al cerrar, **post-delegación** y huella opcional en docs (`agent_contributors`, `pulse_ref` — ver DOC-META-001 §5.3) y en `vitals/pulse/entries/`.

**Vitals / índice:** `vitals/INDEX.md`.
