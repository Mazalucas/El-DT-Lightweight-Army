---
name: recordatorio
description: "[Módulos] Crear recordatorio desde Cursor — cola local en Cerebro profesional. Use when the user invokes /recordatorio or asks to add a reminder from chat."
---

# recordatorio

Captura un recordatorio desde el chat. Los datos van a la **cola local** de Cerebro profesional (`modules/cerebro-profesional/.local/reminders-inbox.jsonl`) y la app los importa al abrir **`/cerebro-profesional`** → vista **Recordatorios**.

## Contrato

Leé **`modules/cerebro-profesional/bridge/README.md`** y validá contra **`modules/cerebro-profesional/bridge/reminders-inbox.schema.json`**.

## Pasos

1. **Parsear** el mensaje del usuario:
   - `@personal`, `@trabajo`, `@proyecto:{id}` (ej. `@proyecto:facturas-autonomo-es`)
   - `#tags` múltiples
   - fechas: mañana, hoy, el viernes, en 3 días → ISO UTC

2. **Construir payload** `PendingReminder`:
   ```json
   {
     "inboxVersion": 1,
     "id": "<uuid>",
     "title": "<texto limpio>",
     "categoryId": "personal",
     "tags": ["casa"],
     "dueAt": "2026-06-04T09:00:00.000Z",
     "source": "cursor-chat",
     "createdAt": "<iso now>"
   }
   ```

3. **Append** una línea JSON en:
   `modules/cerebro-profesional/.local/reminders-inbox.jsonl`
   - Crear `.local/` si no existe (`mkdir -p`)

4. **Opcional:** leer `vitals/ops/session.yaml` → campo `operatorId` en payload si hay sesión.

5. **Responder** al usuario:
   - Resumen: título, categoría, tags, fecha
   - Indicar que abra **`/cerebro-profesional`** → **Recordatorios** (o que aparecerá al abrir la app)
   - Recordar: datos **no** van a Git

## Sintaxis de ejemplo

```text
/recordatorio comprar leche mañana @personal #casa
/recordatorio revisar PR @trabajo #urgente
```

## No hacer

- No commitear `.local/` ni backups JSON con `/guardar`
- No escribir en `modules/recordatorios/.local/inbox.jsonl` (módulo deprecado)
- No escribir en `vitals/work/inbox/` (cuaderno distinto)
- No asumir acceso a IndexedDB del navegador

## Related

- App unificada: `/cerebro-profesional` · vista Recordatorios
- Migración datos viejos: `node modules/cerebro-profesional/scripts/migrate-recordatorios-backup.mjs`
