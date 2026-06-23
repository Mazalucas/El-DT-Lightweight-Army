---
name: sincronizar-notas-meet
description: "[Módulos] Sincronizar notas Gemini de Meet Recordings a Markdown local. Use when the user invokes /sincronizar-notas-meet."
---

# sincronizar-notas-meet

Ejecuta `meet-notes-sync` → escribe en `modules/cerebro-profesional/.local/mirror/`.

## Pasos

1. Comprobar `modules/cerebro-profesional/.local/config.yaml` (copiar desde `config.example.yaml` si falta).
2. Si nunca hubo OAuth y el usuario quiere **contenido completo**:
   - Guía: `modules/meet-notes-sync/README.md`
   - `cd modules/meet-notes-sync && npm run auth`
3. Ejecutar sync:

```bash
./scripts/sync-meet-notes.sh
```

4. Reportar JSON final (scanned, synced, errors) y mensajes.
5. Sugerir abrir **`/cerebro-profesional`** y pulsar «Sincronizar notas» para reindexar en la app.

## Sin OAuth

Se generan stubs `.md` con metadatos del nombre de archivo; el usuario puede exportar Docs a `Meet Recordings/_export/` y volver a sincronizar.
