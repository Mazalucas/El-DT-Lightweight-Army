# Bridge — recordatorios desde chat

Cola local entre `/recordatorio` (Cursor) y Cerebro profesional.

## Archivo

`modules/cerebro-profesional/.local/reminders-inbox.jsonl` — una línea JSON por recordatorio pendiente.

## Schema

`reminders-inbox.schema.json` — compatible con el contrato anterior de `modules/recordatorios/bridge/`.

## API (dev server, puerto 5182)

- `GET /api/reminders-inbox/pending` → `{ items: PendingReminder[] }`
- `POST /api/reminders-inbox/ack` → `{ ids: string[] }`

La app importa al abrir y elimina las filas acked.

## Vista en app

Sidebar → **Recordatorios** (tareas con `dueAt`).
