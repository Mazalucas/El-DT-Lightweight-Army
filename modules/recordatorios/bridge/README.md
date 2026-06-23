# Inbox bridge — recordatorios v1

Contrato entre **captura en Cursor** (`/recordatorio`) y la **app web** (`/recordatorios`).

## Flujo

1. Skill appendea una línea JSON en `modules/recordatorios/.local/inbox.jsonl`
2. App (dev server activo) llama `GET /api/inbox/pending`
3. App importa vía `InboxProcessor` → IndexedDB
4. App llama `POST /api/inbox/ack` con `{ "ids": ["uuid", ...] }`

## Schema

Ver [inbox.schema.json](./inbox.schema.json). Campo obligatorio `inboxVersion: 1`.

## Ejemplo

```json
{
  "inboxVersion": 1,
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Comprar leche",
  "categoryId": "personal",
  "tags": ["casa"],
  "dueAt": "2026-06-04T09:00:00.000Z",
  "source": "cursor-chat",
  "createdAt": "2026-06-03T12:00:00.000Z"
}
```

## Errores

- Línea JSON inválida → se ignora en drain, log en consola dev
- `id` duplicado en IndexedDB → skip idempotente, ack igualmente

## Git

`.local/` está gitignored. No commitear con `/guardar`.
