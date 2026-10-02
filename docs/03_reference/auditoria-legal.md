---
id: DOC-REF-012
title: Auditoría legal del producto (/auditoria-legal)
type: reference
status: canonical
owner: dt-platform
created: 2026-10-02
updated: 2026-10-02
tags:
  - legal
  - privacy
  - compliance
  - audit
  - rgpd
domain:
  - reference
summary: Protocolo para auditar una app o web contra un catálogo legal fechado — territorio primero, evidencia en el repo, y una sección obligatoria de lo que el código no puede probar.
related:
  - DOC-REF-010
  - DOC-META-001
priority: high
intended_audience:
  - engineers
  - ai-agents
source_of_truth: true
review_cycle_days: 90
---

# Auditoría legal del producto (`/auditoria-legal`)

Referencia humana del flujo **`/auditoria-legal`**: cómo el DT recorre un catálogo de cumplimiento (RGPD, LSSI, COPPA, cobros, email, contenido de usuarios) y entrega hallazgos con severidad, arreglo, y los huecos que viven fuera del repositorio.

Fuente machine-readable: skill `.cursor/skills/auditoria-legal/` · subagente `.cursor/agents/auditoria-legal.md` · command `/auditoria-legal`.

## Por qué existe

Una app puede salir en un fin de semana sin aviso de edad, con fuentes de un tercero, con grabación de sesión, con un email sin baja o con una suscripción cuyo texto de renovación está a dos clics del botón. Varios de esos regímenes cuentan por evento (por menor, por sesión, por email, por obra), no como un porcentaje de la facturación. `/auditoria-legal` obliga a mirarlos antes de dar el producto por cerrado.

## Regla de oro

Esto no es un dictamen. Las cifras del catálogo son un techo legal o un fallo concreto, con fecha. No son multas ya aplicadas.

## Tres compuertas

1. **Territorio primero.** Si el repo no dice dónde están los usuarios o a qué mercados se vende, la skill pregunta y no cierra el informe. España implica UE. La UE no implica los deberes solo españoles (aviso legal de la LSSI, edad de 14). Si la persona no sabe el mercado, el alcance supuesto es España, UE y EEUU, y el informe lo marca como supuesto.
2. **Evidencia.** Un hallazgo confirmado cita un archivo o la ausencia real de una página que el control exige. Una sospecha no llega a Crítico.
3. **Fuera del código.** Contrato con el encargado, registro del agente DMCA, panel de Stripe, email que ya salió, backups, umbral de facturación del CCPA, runbook de brecha. Un "pasa" en el repo no los cierra. El informe lo explica en castellano, ítem por ítem.

## Alcance

| Invocación | Alcance |
|------------|---------|
| `/auditoria-legal` | Catálogo entero, filtrado por territorio |
| `/auditoria-legal es` · `eu` · `us` | Ese territorio |
| `/auditoria-legal pagos` · `ugc` · `email` · `analitica` · `menores` · `sms` · `ia` | Controles con ese disparador |

El catálogo vive en `.cursor/skills/auditoria-legal/references/controls.yaml` (vídeo, núcleo, condicionales). Las cifras no se actualizan de memoria: cada una tiene `as_of`.

## Entrega

1. Canvas del IDE (regla `17`), sin commitear.
2. `vitals/work/audits/YYYY-MM-DD-auditoria-legal.md` — gitignoreado.
3. En el chat: veredicto, conteo, y la sección de lo que el código no cubre.

Por defecto la skill propone arreglos y no reescribe políticas. Implementar es de `frontend` o `arquitecto`.

## Relación con `/hack`

`/hack` busca vulnerabilidades de seguridad. `/auditoria-legal` busca patrones de cumplimiento. Un session replay puede salir en las dos: en una como dato sensible mal expuesto, en la otra como interceptación y consentimiento. No se sustituyen.
