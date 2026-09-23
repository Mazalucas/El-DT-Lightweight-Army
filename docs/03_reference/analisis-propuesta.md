---
id: DOC-REF-011
title: Análisis de propuesta multi-modelo (/analisis-propuesta)
type: reference
status: canonical
owner: dt-platform
created: 2026-09-23
updated: 2026-09-23
tags:
  - planning
  - review
  - multi-agent
  - dt-commands
domain:
  - reference
summary: Panel de modelos distintos al autor que evalúa un plan ya escrito en dos rondas con feedback cruzado — solo diagnóstico, sin implementar.
related:
  - DOC-META-001
  - DOC-REF-010
priority: medium
intended_audience:
  - engineers
  - ai-agents
source_of_truth: true
review_cycle_days: 90
---

# Análisis de propuesta multi-modelo (`/analisis-propuesta`)

Referencia humana del flujo **`/analisis-propuesta`**: cómo el DT convoca un panel de LLM **distintos al modelo que escribió el plan**, con la misma rúbrica y dos rondas (ciega + cruzada), para recomendar si adoptar, ajustar, rechazar o reformular — **sin ejecutar** el plan ni escribir en el repo.

Fuente machine-readable: skill `.cursor/skills/analisis-propuesta/` · config `vitals/config/analisis-propuesta.yaml` · command `/analisis-propuesta`.

## Cuándo usarlo

| Situación | Comando |
|-----------|---------|
| Idea suelta, sin plan escrito | `/cuestionar` |
| Plan o propuesta ya redactada, validación fuerte antes de ejecutar | `/analisis-propuesta` |
| Implementar tras la validación | `/orquestar` o `/fast-lane` |

## Qué no promete

Ningún panel garantiza el objetivo al 100%. La entrega usa **condiciones de fallo** (qué supuestos, si fueran falsos, rompen el plan) en lugar de porcentajes verificados. El consenso entre panelistas **no** es prueba: pueden compartir el mismo punto ciego.

## Flujo resumido

1. Congelar brief (objetivo, restricciones, fuera de alcance, plan textual).
2. Elegir hasta tres slugs de **familias distintas** según `vitals/config/analisis-propuesta.yaml` y los modelos disponibles en la sesión; excluir al autor y `inherit`.
3. **Ronda 1** — tres `Task` (`generalPurpose`) en paralelo, a ciegas.
4. **Ronda 2** — cada panelista responde a los dictámenes de los otros (`resume`).
5. **Síntesis** — si el orquestador es el autor del plan, el veredicto lo redacta un panelista no autor; disenso visible.

## Gate duro

Igual que `/cuestionar` en lo esencial: **no** implementar, **no** editar el proyecto, **no** canvas ni informes en `vitals/work/`. Lectura del repo permitida para contrastar el plan con la realidad.

## Rúbrica

Dimensiones: cumple el objetivo, approach correcto, escalable, óptimo, replicable. Recomendación: `adoptar` | `adoptar_con_cambios` | `rechazar` | `reformular`. Detalle y esquemas: `.cursor/skills/analisis-propuesta/references/rubrica.md`.

## Relación con especialistas

No añade un subagente #24. El orquestador usa `Task` con `generalPurpose` y `model` explícito (mismo patrón que otras skills que fan-out sin agente de catálogo, p. ej. `/brag` en su dominio).
