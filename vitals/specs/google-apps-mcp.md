# Google Apps MCP — plugins oficiales por IDE

El DT **no mantiene** un servidor MCP propio. `google-drive-dt` (`@ibarcarty/mcp-server-google-drive`) está **descontinuado**.

Drive, Gmail y Calendar se conectan con el **MCP oficial de cada IDE**. Cada app tiene su propio consentimiento Google. No documentar en Git cuentas, Client IDs, proyectos GCP ni tokens.

ADR: `docs/05_decisions/adr-006-mcp-google-oficial.md` (`DOC-DEC-006`).

## Embudo (obligatorio en `/drive`, `/gmail`, `/calendar`)

Antes de instalar o pedir un consentimiento nuevo, **preguntar siempre**:

> ¿Conectamos **solo [esta app]** o también las otras (Drive, Gmail, Calendar)?

Opciones válidas: solo esta · las tres · un subconjunto.

No asumir “todas”. No instalar el plugin de otra app sin esa respuesta.

Luego:

1. Unión: lo que eligió **más** lo ya marcado en `vitals/config/google-apps.yaml`.
2. Instalar y autenticar el MCP oficial **de ese IDE** (tabla abajo).
3. Si el IDE pide reinicio o auth, esperar a que las tools existan. No inventar el inbox, el Drive ni la agenda.
4. Seguir con el **selector** de esa app (carpetas / etiquetas / calendarios). Si eligió “las tres”, completar el selector de la app del command y ofrecer los otros dos en el mismo turno.

## Instalar por IDE

| IDE | Cómo | Slug / URL | Qué hace el DT |
|-----|------|------------|----------------|
| **Cursor** | Plugin del marketplace | `google-drive` · `gmail` · `google-calendar` | Tool nativa `install_plugin` con ese slug. No afirmar que quedó instalado si el usuario cancela. Después: autenticar el plugin si está en `needsAuth`. |
| **Antigravity** | MCP remoto de Google Workspace | `https://drivemcp.googleapis.com/mcp/v1` · `https://gmailmcp.googleapis.com/mcp/v1` · `https://calendarmcp.googleapis.com/mcp/v1` | Ayudar a pegar el bloque en `~/.gemini/config/mcp_config.json` y completar OAuth del IDE. Las APIs MCP de Google están en **Developer Preview**; hace falta proyecto GCP y client OAuth **web** (IT). |
| **Claude Code / Claude.ai** | Conector remoto (mismo host Google) | Mismas URLs | Settings → Connectors → custom connector. Plan Claude que permita conectores. |
| **Otros** | Si el IDE no tiene plugin ni conector remoto | — | Decir el límite. No reinstalar `google-drive-dt`. |

Cursor — atajo humano: `/add-plugin google-drive`, `/add-plugin gmail`, `/add-plugin google-calendar`.

Guías Google (no copiar Client IDs al repo):

- Workspace MCP: <https://developers.google.com/workspace/guides/configure-mcp-servers>
- Gmail MCP: <https://developers.google.com/workspace/gmail/api/guides/configure-mcp-server>
- Drive MCP: <https://developers.google.com/workspace/drive/api/guides/configure-mcp-server>

## Postura DT (aunque el oficial permita más)

El plugin oficial puede **escribir en Drive** y, en Cursor, **enviar mail**. El DT no usa esas tools salvo pedido explícito y, en mail, **nunca envía**:

| App | Postura |
|-----|---------|
| Drive | Solo lectura. No crear, editar, mover, borrar ni compartir. |
| Gmail | Buscar y leer hilos. Borradores (incl. reply en cadena). Listar y aplicar etiquetas existentes. **Nunca** `send` / `messages.send`. Crear una etiqueta nueva solo si el usuario lo pide y la tool existe. |
| Calendar | Leer, crear, editar. Borrar solo con confirmación. |

Los YAML de contexto son política del DT, no un sandbox de Google. El token del plugin ve todo lo que esa cuenta ve.

## Archivos locales (no Git)

| Archivo | Rol |
|---------|-----|
| `vitals/config/google-apps.yaml` | Qué apps habilitó este operador |
| `vitals/config/drive-context.yaml` | Carpetas Drive |
| `vitals/config/gmail-context.yaml` | Política de Gmail |
| `vitals/config/calendar-context.yaml` | Calendarios |

Plantillas `*.example` sí van al repo.

Ya **no** se usa `~/.config/mcp-server-google-drive/` ni `dt-drive-credentials.json` para el flujo nuevo.

## Tools — nombres oficiales (y alias)

Los nombres cambian según el host. Usar las que **existan**. No fingir un mail o un archivo si no hay tool de lectura.

| Intención | Google remoto (típico) | Cursor / otros (pueden variar) |
|-----------|------------------------|--------------------------------|
| Buscar Drive | `search_files` | `drive_search`, `drive_list_files` |
| Leer Drive | `read_file_content`, `get_file_metadata` | `drive_read_file`, `drive_get_file_info` |
| Buscar mail | `search_threads` | `search_emails`, `gmail_search` |
| Leer hilo | `get_thread` | `read_email` |
| Borrador | `create_draft` (`replyToMessageId` para la cadena) | `gmail_create_draft`, `draft_email` (`threadId` / `inReplyTo`) |
| Etiquetas | `list_labels`, `label_message`, `label_thread` | `list_email_labels`, `create_label`, `modify_email` |
| Agenda | tools Calendar del plugin | `calendar_list_events`, `calendar_create_event`, … |

## Legado `google-drive-dt`

Si `~/.cursor/mcp.json` o la config de Antigravity todavía tienen el servidor `google-drive-dt`:

1. Instalar y autenticar el oficial.
2. Confirmar que las tools oficiales responden.
3. `./scripts/setup-drive.sh --remove-legacy` (saca esa entrada; no toca otros MCP).
4. El operador puede borrar `~/.config/mcp-server-google-drive/` en su máquina. No lo borre el DT sin confirmación.

`./scripts/setup-drive.sh` ya **no** instala `@ibarcarty/mcp-server-google-drive`. Imprime la guía del IDE o, con `--remove-legacy`, limpia el servidor viejo.

## Referencias

- Skills: `.cursor/skills/dt-drive/` · `dt-gmail/` · `dt-calendar/`
- Guía: `docs/02_guides/drive-cerebro-setup.md` (`DOC-GUIDE-009`)
- Admin Workspace: `docs/06_operations/drive-google-cloud-admin.md` (`DOC-OPS-002`)
