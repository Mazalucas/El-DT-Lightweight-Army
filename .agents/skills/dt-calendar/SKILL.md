---
name: dt-calendar
description: "[Rutina] Conectar Google Calendar al cerebro del DT — OAuth compartido con Drive/Gmail, calendarios, eventos. Use when the user invokes /calendar or wants the DT to list or create calendar events."
---

# dt-calendar

Integración **opcional** de Calendar vía el mismo MCP que Drive (`google-drive-dt`). Un token, varios scopes. Spec: `vitals/specs/google-apps-mcp.md`.

**Guías:** `docs/02_guides/drive-cerebro-setup.md` (`DOC-GUIDE-009`) · admin: `docs/06_operations/drive-google-cloud-admin.md` (`DOC-OPS-002`).

## Prerequisitos

Igual que `/drive`: sesión (`/yo`), Node 18+, JSON OAuth de la empresa, MCP en el IDE.

## Archivos

| Archivo | Git | Rol |
|---------|-----|-----|
| `~/.config/mcp-server-google-drive/oauth-credentials.json` | No | App interna (compartida) |
| `~/.config/mcp-server-google-drive/tokens.json` | No | Token de la cuenta que autorizó |
| `vitals/config/google-apps.yaml` | No | Apps habilitadas |
| `vitals/config/calendar-context.yaml` | No | Calendarios + zona horaria |
| `vitals/config/calendar-context.yaml.example` | Sí | Plantilla |

## Flujo `/calendar`

1. Confirmar `/yo`.
2. **Embudo** (no saltear): *¿solo Calendar o también Drive y Gmail?* Ver spec.
3. Armar `--apps` (unión con `google-apps.yaml` si ya hay otras apps).
4. `./scripts/setup-drive.sh [creds] --apps <lista> [--ide …]` — re-auth si faltan scopes.
5. Reiniciar IDE si las tools no aparecen.
6. **Selector de calendarios** (abajo).
7. Actualizar `google-apps.yaml` (`calendar: true`) y `calendar-context.yaml`.

Si ya hay Calendar conectado y solo quieren cambiar calendarios → selector, sin re-auth.

## Selector de calendarios

Default razonable: `id: primary` (agenda principal de la cuenta autorizada).

1. Mostrar `calendar-context.yaml` si existe.
2. Preguntar zona horaria (default `Europe/Madrid` si el usuario no dice otra).
3. Preguntar si hay calendarios extra (pegar el Calendar ID de la configuración de Google, o quedarse en `primary`).
4. Por cada calendario: propósito en 1 frase; `write: true` solo si aceptan que el DT cree/edite eventos ahí.
5. `sync_mode: all_calendars` solo si lo piden explícitamente.
6. Escribir el YAML (schema del `.example`). No va a Git.

## Uso diario

Cuando `calendar-context.yaml` existe y el MCP está activo:

1. Listar/crear/editar solo en los `calendars[].id` registrados (`selective`).
2. Crear o actualizar eventos cuando el usuario lo pide; **borrar** solo con confirmación explícita.
3. Citar calendario + título + horario en la respuesta.
4. No copiar descripciones sensibles al repo sin confirmación.

## Tools

| Tool | Uso |
|------|-----|
| `calendar_list_events` | Ventana de tiempo; IDs para update/delete |
| `calendar_create_event` | Timed o all-day; RRULE / reminders opcionales |
| `calendar_update_event` | Patch de campos |
| `calendar_delete_event` | Solo con OK del usuario |

## No hacer

- No commitear contextos, tokens ni credenciales.
- No borrar eventos recurrentes enteros sin avisar (el delete del padre borra instancias).
- No asumir Calendar conectado — opt-in.
- No documentar en el repo qué cuenta o proyecto GCP se usó.
