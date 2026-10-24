---
id: DOC-DEC-007
title: "ADR-007: Agentes miembro e inbox en Git"
type: decision
status: canonical
owner: dt-platform
created: 2026-10-24
updated: 2026-10-24
tags:
  - adr
  - agents
  - roster
  - inbox
domain:
  - meta
summary: Agentes persistentes como miembros del roster con owner humano, y comunicación asíncrona entre miembros por archivos en vitals/work/inbox/, validada por dt-doctor.
related:
  - DOC-REF-001
  - DOC-OPS-001
  - DOC-DEC-002
keywords:
  - agentes
  - inbox
  - roster
  - asincrónico
priority: high
intended_audience:
  - engineers
  - ai-agents
source_of_truth: true
review_cycle_days: 180
---

# ADR-007: Agentes miembro e inbox en Git

## Contexto

Agentes que corren sin una persona en el chat (cloud, automations, otro IDE) empiezan a trabajar sobre el repo. El DT no les decía quiénes eran, qué podían tocar ni cómo pasarse trabajo entre sesiones. Dentro de un chat eso ya está resuelto con la delegación y `vitals/relay/handoff-template.md`; entre sesiones no.

## Decisión

1. **Miembro agente:** entrada `kind: agent` en `roster.yaml`, con `owner` humano, `runtime`, `scope` y `status`. Entra `pending`; solo el owner lo activa.
2. **Identidad:** `/yo` en modo agente escribe la sesión local, solo si el agente está `active`.
3. **Inbox:** `vitals/work/inbox/{id}/`, un archivo por mensaje con frontmatter (`from`, `to`, `type`, `status`, `created`). Otros crean; solo el dueño cambia estado o archiva. Sin edición de archivos ajenos → sin conflictos de merge.
4. **Transporte:** Git (`/actualizar` recibe, `/guardar` envía). Sin infraestructura nueva.
5. **Límites:** tope de 5 mensajes por hilo entre agentes antes de escalar al owner; gate duro intacto; sin altas en el checkout oficial.
6. **Comando único:** `scripts/dt-agent.sh` ejecuta todas las operaciones y rechaza lo que el contrato prohíbe (autoactivación, estados ajenos, duplicados, topes). Los agentes no interpretan la prosa: corren el comando.
7. **Estado a prueba de edición manual:** solo personas cambian el estado de un agente (`DT_AGENT_ID` lo bloquea). `dt-agent` deja `status_by`/`status_at`, y `dt-doctor` exige `status_by` = owner y que el autor del commit (`git blame` de la línea `status:`) tenga el email del owner. Con agentes cloud se recomienda además `CODEOWNERS` + review obligatoria sobre `roster.yaml` (configuración de GitHub, no impuesta por el DT).
8. **Verificación:** `dt-doctor` valida roster, mensajes, vencimientos y el trailer `DT-Member` del commit contra el `from`; `test-dt-agent.sh` cubre el comando.

Contrato operativo: `vitals/specs/agent-inbox.md`.

## Alternativas consideradas

- **Issues de GitHub / Linear como canal:** notificaciones y UI, pero la memoria sale del repo y depende de MCPs distintos por IDE.
- **Servidor MCP o cola:** tiempo real, pero es infraestructura y contradice el carácter lightweight.
- **No hacer nada:** cada agente inventaría su protocolo; sin owner ni scope.

## Consecuencias

- **Pros:** opt-in con costo cero; auditable en el historial; mismo ritual para humanos y agentes.
- **Contras:** no es tiempo real; un agente que no se dispara solo no lee su inbox; la autoría es declarativa (trailer `DT-Member`, email del commit), no criptográfica — suficiente para un equipo chico con owners que revisan. Un agente con la credencial git del owner no se distingue de él: darle identidad propia o exigir review de code owners.
