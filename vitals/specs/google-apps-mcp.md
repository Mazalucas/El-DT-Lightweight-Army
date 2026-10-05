# Google Apps MCP — plugins oficiales por IDE

El DT **no mantiene** un servidor MCP propio. `google-drive-dt` (`@ibarcarty/mcp-server-google-drive`) está **descontinuado**.

Drive, Gmail y Calendar se conectan con el **MCP oficial de cada IDE** (marketplace, MCP Store o conector del fabricante). Cada app tiene su propio consentimiento Google. No documentar en Git cuentas, Client IDs, proyectos GCP ni tokens.

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

## Instalar (el mismo procedimiento en todos los IDE)

Detectá el IDE de esta conversación y usá **solo** la fila que corresponde. Embudo, espera de tools, selector y postura son iguales en todos.

**Marketplace / Store primero.** El agente no edita `mcp_config.json` salvo para **nombrar la URL oficial** si el Store no lista esa app. Nunca escribe un bloque `oauth`.

| IDE | Conector oficial | Qué hace el agente |
|-----|------------------|--------------------|
| **Cursor** | Plugin del marketplace. Slugs: `google-drive` · `gmail` · `google-calendar` | `install_plugin` con ese slug. Atajo humano: `/add-plugin <slug>`. Si `needsAuth`, autentica el operador. No afirmar que quedó instalado si cancela. |
| **Antigravity** | MCP Store o Marketplace; si no está listada, URL remota de Google | 1) Customizations → Marketplace, o Settings → Add MCP / panel MCP Servers. Buscar Gmail, Drive o Calendar. Instalar. 2) Si ya está la URL oficial y no hay tools: Settings → Installed MCP Servers → Refresh → **Authenticate**. 3) URLs solo si el Store no la ofrece: Drive `https://drivemcp.googleapis.com/mcp/v1` · Gmail `https://gmailmcp.googleapis.com/mcp/v1` · Calendar `https://calendarmcp.googleapis.com/mcp/v1` (`~/.gemini/config/mcp_config.json`). |
| **Claude Code / Claude.ai** | Connectors / marketplace del plan | Settings → Connectors. Si hay conector oficial de esa app, usarlo. Si no, custom connector con la **misma URL** de la fila Antigravity. Plan con conectores. Si el alta pide Client ID: **Freno**. |
| **Otro IDE con `receives_skills`** | El conector oficial que ese IDE publique para el mismo slug o la misma URL | Si no hay conector, decir el límite. |
| **Sin conector** | — | Parar. No reinstalar `google-drive-dt`. |

### Freno: no aparece Authenticate

Si la URL o el plugin ya está y el IDE no muestra **Authenticate** (o no hay tools):

1. **Parar.** No seguir al selector. No inventar el inbox, el Drive ni la agenda.
2. **No recorras Google Cloud Console.** No habilites APIs, no crees un client OAuth, no dictes redirect URIs y no pidas un proyecto GCP personal.
3. **No abras** el runbook de IT ni las fichas de Google Cloud MCP. No transcribas esos pasos. No armes un JSON con credenciales OAuth.
4. Decí **solo** esto (sin expandirlo): *Falta el client OAuth de la organización. Pedíselo a IT. Si no hay IT, usá la documentación oficial de Google Workspace MCP en tu navegador. El DT no recorre Google Cloud Console ni pega secrets.*
5. Seguir solo cuando haya tools reales.

Ese client no es el servidor propio del DT. Es un requisito que Google pide hoy en Antigravity y Claude (Developer Preview, sin registro dinámico). En Cursor el marketplace no pide ese paso. Lo entrega IT **una vez** para la org, fuera de este chat.

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
- Guía usuario: `docs/02_guides/drive-cerebro-setup.md` (`DOC-GUIDE-009`)
- Paridad de skills: `/skills` · `vitals/specs/skill-standard.md`
