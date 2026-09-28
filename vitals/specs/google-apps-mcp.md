# Google Apps MCP — embudo compartido (Drive, Gmail, Calendar)

Un solo servidor MCP (`google-drive-dt`, paquete `@ibarcarty/mcp-server-google-drive`) y **un solo token OAuth**. Drive, Gmail y Calendar no son tres logins: son scopes del mismo consentimiento.

No documentar en Git cuentas, Client IDs, nombres de proyecto GCP ni tokens. Credenciales de la empresa: canal interno → `~/.config/mcp-server-google-drive/`.

## Embudo (obligatorio en `/drive`, `/gmail`, `/calendar`)

Antes de correr el instalador o de pedir un consentimiento nuevo, **preguntar siempre**:

> Este login de Google es el mismo para Drive, Gmail y Calendar. ¿Damos acceso **solo a [esta app]** o a **las tres**?

Opciones válidas: solo esta · las tres · un subconjunto (ej. Gmail + Calendar).

No asumir “todas”. No agregar scopes de otra app sin esa respuesta.

Luego:

1. Unión de apps: lo que eligió **más** lo ya marcado en `vitals/config/google-apps.yaml` (no revocar una app ya conectada al sumar otra).
2. `./scripts/setup-drive.sh [creds.json] --apps <lista> [--ide …]`
3. Si el token no tiene esos scopes, el script reabre el navegador (`prompt=consent` implícito al borrar el token viejo).
4. Reiniciar el IDE.
5. Seguir con el **selector de esa app** (carpetas / etiquetas / calendarios). Si eligió “las tres”, completar el selector de la app del command y ofrecer los otros dos en el mismo turno.

## Scopes (DT)

| App | Scopes | Postura DT |
|-----|--------|------------|
| Drive | `drive.readonly` | Solo lectura. No crear/editar/borrar en Drive. |
| Gmail | `gmail.readonly` + `gmail.compose` | Leer si hay tools de lectura. Crear **borradores**. Nunca enviar (no hay tool de send en el servidor). |
| Calendar | `calendar` | Leer, crear, editar, borrar eventos — confirmar con el usuario antes de borrar. |

`--apps all` = las tres filas.

## Archivos locales (no Git)

| Archivo | Rol |
|---------|-----|
| `~/.config/mcp-server-google-drive/oauth-credentials.json` | Client de la empresa |
| `~/.config/mcp-server-google-drive/tokens.json` | Token de **la cuenta que hizo clic** en Google |
| `vitals/config/google-apps.yaml` | Qué apps habilitó este operador |
| `vitals/config/drive-context.yaml` | Carpetas Drive |
| `vitals/config/gmail-context.yaml` | Política de Gmail |
| `vitals/config/calendar-context.yaml` | Calendarios |

Plantillas `*.example` sí van al repo.

## MCP publicado vs tools

El paquete 1.4.x ya trae Calendar (CRUD) y `gmail_create_draft`. No hace falta Cloud Run ni un segundo MCP. Si faltan tools de lectura de Gmail (`gmail_search` / `gmail_get_message`), no inventar el inbox: usar la política de contexto y borradores, y decir el límite.

El token ve todo lo que esa cuenta Google ve. Los YAML son política del DT, no un sandbox.
