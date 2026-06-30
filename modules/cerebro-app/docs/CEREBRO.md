# Cerebro — copiloto in-app

Documentación técnica del agente conversacional embebido en Cerebro App (no confundir con el DT del repo).

## API

| Endpoint | Descripción |
|----------|-------------|
| `GET/POST /api/cerebro/context` | Living Context Snapshot + chip + moment_card |
| `POST /api/cerebro/chat` | Chat SSE v2 (text, block, ui_cue, proactive_moment) |
| `POST /api/cerebro/moments/dismiss` | Persistir dismiss de moment_card |
| `GET /api/cerebro/conversations` | Historial (comparte store con `/api/assistant`) |

## Protocolo compartido

- `shared/cerebro-chat.ts` — tipos LCS, SSE, blocks
- `shared/cerebro-elements.ts` — EntityRef, EntityEffect, lifecycle DOM (`data-cerebro-entity`)
- `shared/cerebro-ui-registry.ts` — catálogo cerrado de targets ambient

### SSE `entity_effect`

Cuando Cerebro muta una entidad vía tool (`create_todo`, `update_todo`, `move_todo`, `complete_todos`, `highlight_entity`, …), el stream puede emitir:

```json
{ "type": "entity_effect", "effect": { "ref": { "kind": "todo", "id": "…" }, "op": "move", "patch": { "status": "done" }, "source": "cerebro", "toolName": "move_todo" } }
```

El cliente (`CerebroPanel`) aplica el efecto en `EntityActionBus` — mismo bus que drag/click del usuario. Con `liveElements: true` (Ajustes → Cerebro), los parches son optimistas + refetch debounced; sin flag, refetch clásico.

### Contexto enriquecido

`CerebroClientContextInput.navigation` incluye:

- `focusedEntity` — tarjeta seleccionada (`TodoCard` click)
- `visibleEntities` — entidades con `data-cerebro-entity` en viewport

El server (`context-builder.ts`) las incluye en el prompt situacional.

## Entity Action Bus (SPA)

| Módulo | Rol |
|--------|-----|
| `EntityActionBus.tsx` | Provider; `applyEffect`, optimistic todo patch/move |
| `board-cache.ts` | Parches `qk.board` / `qk.orgBoard` |
| `dashboard-cache.ts` | Parches vista Hoy |
| `schedule-refetch.ts` | Debounce 400ms por dominio |
| `entity-lifecycle-store.ts` | Zustand: lifecycle + focusedEntity + visibleEntities |
| `catalog-cache.ts` | Parches optimistas proyectos/equipos en board + people view |
| `use-visible-entities.ts` | IntersectionObserver → entidades visibles en contexto IA |
| `use-entity-mutation.ts` | Hook unificado para encolar mutaciones con entityMutation |
| `ActionQueueProvider` | Cola serial + optimistic cuando `liveElements` |

Integración: `main.tsx` — `EntityActionBusProvider` → `ActionQueueProvider`.

## Assistant Tool Providers (in-process)

| Provider | Tools |
|----------|-------|
| `calendar` | `get_calendar_today`, `get_next_imminent_event` |
| `meeting-prep` | `get_meeting_prep` — pendientes, serie, preview notas |
| `navigation` | `list_ui_targets`, `guide_user`, `highlight_entity` |
| `planner` | `propose_action_plan`, `confirm_plan` |
| `inbox` | `create_todo`, `update_todo`, `move_todo`, `complete_todos`, … |

Implementación: `functions/src/cerebro/providers/` + `functions/src/assistant/tools.ts`

## Preferencias (Ajustes → Cerebro)

Persistidas en `UserAppSettings.cerebro`:

- `proactiveLevel`: off | subtle | active
- `meetingReminderMinutes`: 10 | 15 | 30
- `chipMeetingMinutesMax`: 60 | 90 | 120
- `liveElements`: boolean (default `false`) — UI viva + parches optimistas

## UI React

- `CerebroShell` — burbuja + panel compacto
- `#/cerebro` — vista expandida con historial
- `CerebroAmbientLayer` — spotlight overlay (`data-cerebro-target` y `data-cerebro-entity`)
- `CerebroElement` / `TodoCard` — kanban con @dnd-kit + Framer Motion
- `data-cerebro-target` en nav, sync, ajustes
- `data-cerebro-entity="{kind}:{id}"` en tarjetas de dominio

## Personalidad

`functions/src/assistant/knowledge/cerebro-behavior.md` — protocolo no-cómplice.

## Legacy

- `/api/assistant` sigue activo por compatibilidad
- Bubble vanilla (`src/ui/assistant-bubble.ts`) — solo app legacy `main.ts`; la SPA React usa `CerebroShell`
