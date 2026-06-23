---
id: DOC-GUIDE-013
title: "Cerebro App — pipeline, inbox y grafo org"
type: guide
status: active
owner: dt
updated: "2026-06-11"
tags: [cerebro, firebase, org, graph, inbox, pipeline]
summary: "Procesamiento determinístico del cerebro profesional en producción: sugerencias persistentes, health, repair y grafo personal/org."
related: [DOC-GUIDE-011, DOC-GUIDE-010]
priority: high
source_of_truth: true
---

# Cerebro App — pipeline, inbox y grafo org

Guía operativa para el flujo **sync → import → sugerencias → inbox humano → ingest org → grafo** en **`cerebro-prime-a0729`**.

## Decisiones de producto

| Caso | Comportamiento |
|------|----------------|
| Participante con email | Contacto en `people` |
| Participante sin email | `prospects` + sugerencia `promote_prospect` en inbox |
| Proyecto inferido (IA o título) | `pendingSuggestions` (`assign_project`) — **no** auto-crear en catálogo |
| Equipo inferido | Sugerencia `assign_team` si no está en `meeting.teamIds` |
| Action items Gemini | `todos` con `status: suggested` |
| Grafo personal | Solo `users/{uid}/store/main` |
| Grafo org | `orgs/{orgId}/store/main` + nodos `member` y aristas `contributed` |

## Pipeline personal

1. **Sync** — indexa mirrors Meet en Drive.
2. **Import** (`fullImportFromMirrors`) — reuniones, contactos, prospects, sugerencias de proyecto/equipo.
3. **Análisis IA** (opcional) — emite sugerencias; no inserta proyectos UUID.
4. **Health** — `GET /api/catalog/health`.

Tras import, el panel **Salud del procesamiento** en Profesional → Inbox muestra métricas y el botón **Reparar store** (dedupe proyectos, reimport).

## Inbox v2

Sugerencias persistentes en `store.pendingSuggestions` (ids `ps-*`).

| Endpoint personal | Acción |
|-------------------|--------|
| `GET /api/catalog/suggestions` | Lista activas |
| `POST /api/catalog/suggestions/:id/dismiss` | Descartar |
| `POST /api/catalog/suggestions/:id/accept-project` | Crear o vincular proyecto (`slugId`) |
| `POST /api/catalog/suggestions/:id/accept-team` | Asignar equipo |
| `GET /api/catalog/prospects/:id/candidates` | Candidatos para vincular prospect |

Equivalentes org bajo `/api/orgs/:orgId/...`.

## Ingest org v2

`POST /api/orgs/:orgId/ingest` fusiona stores de miembros:

- Reuniones: `contributorUids` acumulados.
- People / prospects: merge por email o nombre normalizado.
- Proyectos: merge por `slugId(name)` (sin UUID sueltos).
- `pendingSuggestions`: unión idempotente.
- Tras ingest: `rebuildGraphEdges` en el store org.

Health org: `GET /api/orgs/:orgId/health`.

## Grafo

Aristas materializadas en `store.graphEdges` (regeneración idempotente).

| Endpoint | Scope |
|----------|--------|
| `GET /api/catalog/graph?center=&depth=` | Personal |
| `GET /api/orgs/:orgId/graph?center=&depth=&memberUid=` | Org |

En la UI, tab **Red**: click en nodo recentra el subgrafo (profundidad 2). Org incluye leyenda con tipo `member`.

## Migración / repair en producción

Solo admins org o el usuario en store personal:

```http
POST /api/admin/repair-store
Authorization: Bearer {Firebase ID token}
Content-Type: application/json

{}                    # repair personal del usuario autenticado
{ "orgId": "..." }    # repair org (org_owner / org_admin)
```

El job:

1. Dedupe proyectos por `slugId(name)` y fusiona referencias en reuniones/todos.
2. Mueve proyectos UUID huérfanos a `pendingSuggestions` o elimina si ya dismissed.
3. Re-ejecuta `fullImportFromMirrors` por miembros afectados (org).
4. Re-ingest org y `rebuildGraphEdges`.

### Secuencia recomendada post-deploy

1. Deploy según [cerebro-app-deploy.md](cerebro-app-deploy.md) (`DOC-GUIDE-011`).
2. Cada miembro: login → Profesional → sync + import (o pipeline automático).
3. Admin org: Inbox org → **Reparar store org** o `POST /api/admin/repair-store` con `orgId`.
4. `POST /api/orgs/:orgId/ingest`.
5. Validar health en verde (0 huérfanos, participantes resueltos, 0 proyectos auto-IA).

## Criterios de aceptación

1. Reuniones con mirror → 100 % synced.
2. Participantes en reuniones → `personId` o `prospectId`.
3. 0 proyectos creados por IA sin pasar por inbox.
4. Inbox con sugerencias accionables (contactos, proyectos, equipos, tareas).
5. Grafo org: miembros + entidades + co-asistencia navegable.
6. Grafo personal: solo datos del usuario autenticado.

## Related docs

- [Cerebro App — deploy](cerebro-app-deploy.md) (`DOC-GUIDE-011`)
- [Cerebro profesional — setup](cerebro-profesional-setup.md) (`DOC-GUIDE-010`)
