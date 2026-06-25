---
id: DOC-DEC-002
title: "ADR-002: Orden continuo — loop autónomo siempre activo"
type: decision
status: canonical
owner: dt-platform
created: 2026-06-13
updated: 2026-06-13
tags:
  - adr
  - autonomy
  - order
domain:
  - meta
summary: Decisión de convertir el "ordenar" del DT en un loop autónomo siempre activo, verificable con dt-doctor, con autonomía total salvo un gate duro de seguridad e irreversibles.
related:
  - DOC-DEC-001
  - DOC-OV-004
keywords:
  - orden continuo
  - loop autónomo
  - dt-doctor
  - autonomía
  - gate duro
priority: high
intended_audience:
  - engineers
  - ai-agents
source_of_truth: true
review_cycle_days: 180
---

# ADR-002: Orden continuo — loop autónomo siempre activo

## Contexto

El mayor talento del DT es ordenar, pero el orden estaba solo **descrito** (protocolo declarativo) y nada lo **medía ni aplicaba solo**. El orden óptimo dependía de la disciplina del modelo en cada turno: caro en tokens y no determinístico entre sesiones y personas.

## Decisión

1. **Orden como dato verificable:** catálogo e IDs derivados (`sync-catalog`), paridad multi-IDE (`sync-ide --check`).
2. **Verificador (`dt-doctor`):** define objetivamente "orden cumplido" (DoD) y devuelve exit code.
3. **Loop autónomo siempre activo:** la regla `07-orden-continuo` (`alwaysApply: true`) dispara, tras cualquier cambio sustantivo, el ciclo ejecutar → `dt-doctor` → corregir → reverificar, sin que el usuario lo pida.
4. **Autonomía total con gate duro:** bajo autonomía el loop ejecuta y corrige incluso cambios de impacto **sin preguntar**, excepto el gate duro de `vitals/specs/precedence.md` (seguridad/secretos e irreversibles de FS/Git).
5. **Condiciones de corte:** tope de iteraciones, detección de no-progreso y freno de emergencia (`stop`/`pará`).

## Alternativas consideradas

- **Solo proponer (sin escribir):** descartada por decisión del owner — se busca autonomía real.
- **Más reglas declarativas:** descartada — no cierra el loop; el problema era falta de verificación, no de normativa.

## Consecuencias

- **Pros:** el orden se mantiene solo y es auditable; menos deuda de catálogo/IDs/paridad.
- **Contras:** la autonomía total puede aplicar cambios de impacto que en review no querías (mitigado parcialmente por el gate duro y las condiciones de corte); más peso operativo (scripts), en tensión con la filosofía lightweight.
