---
description: Catálogo de subagentes - Qué existen y cuándo invocarlos
alwaysApply: true
---

# Catálogo de Subagentes

Cursor inyecta la descripción de cada subagente en la herramienta **Task**. Usá este mapa para elegir rol; al delegar, incluí protocolos DT (`01-protocolos-dt`).

## Mapeo rápido (keyword → subagente)

- backend, api, database, server → **arquitecto**
- frontend, ui, ux, client → **frontend** o **ui-designer** (Atelier: `/atelier`)
- deploy, ci/cd → **devops** · test, qa → **qa**
- planilla, csv, totales → **data-auditor** (`/verificar`, regla `16`)
- docs, readme → **doc** · research → **researcher**
- PRD / SRD / plan MVP → **prd-creator** / **srd-creator** / **development-planner**
- marketing, SEO, ads → **marketing-strategist** (guías en `.cursor/skills/marketing/*/GUIDE.md`)
- remotion, video programático → **remotion-producer**
- operations, monitoring → **operations-maintainer**

Lista completa y keywords: [README — Subagentes](README.md#catálogo-de-los-22-especialistas).

## Prompt de delegación (compacto)

1. Contexto de la tarea y formato de salida esperado.
2. Protocolos DT: ordenar, cuestionar, alternativas, **Contexto consultado**, puntos ciegos.
3. Si **web**: bloque stack (`08`, `vitals/data/engineering/web-stack.yaml`).
4. Si **código** (`arquitecto`, `frontend`, `devops`, `qa`, `remotion-producer`): bloque reuse — skill `engineering-reuse`, diff mínimo, sección **Qué reutilicé**.
5. Si **cifras**: bloque numérico — regla `16`, script ejecutado, etiquetas de procedencia.

Varios pedidos en un mensaje: cada agente solo su rol; fuera de alcance → `DEFER: <rol>`.

**Vitals:** `vitals/INDEX.md`.
