# Google Drive como contexto del cerebro

Integración **opcional** vía el MCP **oficial del IDE**. Aplica cuando existe `vitals/config/drive-context.yaml` o el usuario invocó `/drive`.

`google-drive-dt` está descontinuado — spec `vitals/specs/google-apps-mcp.md`.

## Cuándo consultar Drive

- El usuario pide contexto que probablemente vive en Drive ("buscá en mis briefs", "qué dice el doc de X").
- Necesitás información de carpetas registradas en `drive-context.yaml`.
- Generar entregables a partir de documentos en Drive **sin** copiarlos al repo (solo lectura).

## Límites obligatorios

1. **Solo carpetas registradas** — con `sync_mode: selective`, consultar únicamente dentro de los `folders[].id` del registro. Con `full_drive`, advertir que la búsqueda es amplia.
2. **Solo lectura** — no crear, editar, mover, borrar ni compartir, aunque el plugin oficial tenga esas tools.
3. **Consulta dirigida** — listar/buscar primero; leer solo archivos relevantes. No volcar carpetas enteras al contexto.
4. **Charter no-secrets** — no persistir en Git tokens, credenciales ni contenido sensible de Drive sin confirmación (`vitals/charter/no-secrets.md`).
5. **Drive ≠ memoria del repo** — destilar a `vitals/` o `docs/` solo si el usuario pide guardar algo en el cerebro compartido.
6. **Embudo** — preguntar si el acceso es solo Drive o también Gmail y Calendar. Instalar el MCP oficial de **ese IDE** (`vitals/specs/google-apps-mcp.md`).

## Resolución de carpeta

Antes de buscar, leer `vitals/config/drive-context.yaml`:

- Matchear la intención del usuario con `purpose` y `keywords` de cada carpeta.
- Si hay ambigüedad, preguntar qué carpeta usar.
- Citar siempre nombre de carpeta + archivo consultado en la respuesta.

## Referencias

- Skill: `.cursor/skills/dt-drive/` · command `/drive` · Gmail `/gmail` · Calendar `/calendar`
- Spec: `vitals/specs/google-apps-mcp.md`
- Guía usuario: `docs/02_guides/drive-cerebro-setup.md` (`DOC-GUIDE-009`)
- Paridad de skills: `/skills` · `vitals/specs/skill-standard.md`
