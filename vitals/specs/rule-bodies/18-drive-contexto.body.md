# Google Drive como contexto del cerebro

Integración **opcional** vía MCP. Aplica cuando existe `vitals/config/drive-context.yaml` o el usuario invocó `/drive`.

## Cuándo consultar Drive

- El usuario pide contexto que probablemente vive en Drive ("buscá en mis briefs", "qué dice el doc de X").
- Necesitás información de carpetas registradas en `drive-context.yaml`.
- Generar entregables a partir de documentos en Drive **sin** copiarlos al repo (solo lectura).

## Límites obligatorios

1. **Solo carpetas registradas** — con `sync_mode: selective`, consultar únicamente dentro de los `folders[].id` del registro (queries `'<folderId>' in parents` o búsqueda acotada). Con `full_drive`, advertir al usuario que la búsqueda es amplia.
2. **Solo lectura** — scope `drive.readonly`; no crear, editar, mover ni borrar archivos en Drive.
3. **Consulta dirigida** — listar/buscar primero; leer solo archivos relevantes. No volcar carpetas enteras al contexto.
4. **Charter no-secrets** — no persistir en Git tokens, credenciales ni contenido sensible de Drive sin confirmación (`vitals/charter/no-secrets.md`).
5. **Drive ≠ memoria del repo** — Drive es biblioteca consultable; destilar a `vitals/` o `docs/` solo si el usuario pide guardar algo en el cerebro compartido.

## Resolución de carpeta

Antes de buscar, leer `vitals/config/drive-context.yaml`:

- Matchear la intención del usuario con `purpose` y `keywords` de cada carpeta.
- Si hay ambigüedad, preguntar qué carpeta usar.
- Citar siempre nombre de carpeta + archivo consultado en la respuesta.

## Referencias

- Skill: `.cursor/skills/dt-drive/` · command `/drive`
- Guía usuario: `docs/02_guides/drive-cerebro-setup.md` (`DOC-GUIDE-009`)
- Admin OAuth: `docs/06_operations/drive-google-cloud-admin.md` (`DOC-OPS-002`)
