---
name: cerebro-work
description: "[Módulos] Atajo de sync del cerebro profesional (Meet → Markdown). Use when the user invokes /CerebroWork or /cerebro-work."
---

# cerebro-work

Ejecuta el sync completo de notas Meet desde la **raíz de Lucas Prime**.

## Comando

```bash
cd "/Users/lucas/Documents/Apps_Dev/Lucas Prime"
./scripts/sync-meet-notes.sh
```

## Pasos

1. Resolver repo root (`vitals/workspace.yaml` si aplica multi-proyecto; si no, path anterior).
2. Verificar `modules/meet-notes-sync/.local/google-credentials.json` y, para contenido real, `google-token.json` (si falta: `cd modules/meet-notes-sync && npm run auth`).
3. Ejecutar `./scripts/sync-meet-notes.sh` desde la raíz.
4. Si el manifest ya dice `synced` pero los `.md` son stubs (`## Pendiente de contenido`), repetir con `./scripts/sync-meet-notes.sh --force`.
5. Reportar la última línea JSON (`scanned`, `synced`, `skipped`, `errors`) y mensajes del script.
6. Ejecutar procesamiento completo del cerebro:
   ```bash
   node modules/cerebro-profesional/scripts/process-all-meetings.mjs
   ```
   (o `./scripts/process-cerebro-all.sh` para sync + procesar en un solo paso).
7. Sugerir abrir `/cerebro-profesional` y recargar — la app restaura `cerebro-store.json` automáticamente.

## Alias

Equivalente a `/sincronizar-notas-meet` con foco en el script de raíz.
