---
name: dt-calendar
description: "[Rutina] Conectar Google Calendar al cerebro del DT — plugin oficial del IDE, calendarios, eventos. Use when the user invokes /calendar or wants the DT to list or create calendar events."
---

# dt-calendar

Integración **opcional** de Calendar vía el **MCP oficial del IDE**. `google-drive-dt` está descontinuado.

**Spec:** `vitals/specs/google-apps-mcp.md`. **Guías:** `docs/02_guides/drive-cerebro-setup.md` (`DOC-GUIDE-009`) · admin: `docs/06_operations/drive-google-cloud-admin.md` (`DOC-OPS-002`). **ADR:** `DOC-DEC-006`.

## Prerequisitos

Sesión (`/yo`). Plugin o conector oficial de Calendar. Sin JSON Desktop ni Node.

## Archivos

| Archivo | Git | Rol |
|---------|-----|-----|
| `vitals/config/google-apps.yaml` | No | Apps habilitadas |
| `vitals/config/calendar-context.yaml` | No | Calendarios + zona horaria |
| `vitals/config/calendar-context.yaml.example` | Sí | Plantilla |

## Flujo `/calendar`

1. Confirmar `/yo`.
2. **Embudo:** *¿solo Calendar o también Drive y Gmail?*
3. **Instalar el oficial:**
   - **Cursor:** `install_plugin` con `pluginName: google-calendar`. Auth si `needsAuth`.
   - **Antigravity / Claude:** URL `https://calendarmcp.googleapis.com/mcp/v1` (spec).
4. Esperar tools de listar/crear eventos. Si no hay, parar.
5. **Selector de calendarios.** `google-apps.yaml` (`calendar: true`) + `calendar-context.yaml`.
6. Legado `google-drive-dt` → `--remove-legacy` cuando el oficial liste eventos.

Si solo quieren cambiar calendarios → selector.

## Selector de calendarios

Default: `id: primary`.

1. Mostrar `calendar-context.yaml` si existe.
2. Zona horaria (default `Europe/Madrid` si no dicen otra).
3. Calendarios extra (Calendar ID) o quedarse en `primary`.
4. Por cada uno: propósito; `write: true` solo si aceptan que el DT cree/edite.
5. `sync_mode: all_calendars` solo si lo piden.
6. Escribir el YAML (schema del `.example`). No va a Git.

## Uso diario

1. Operar solo en `calendars[].id` (`selective`).
2. Crear/editar si lo piden y `write: true`. **Borrar** solo con confirmación.
3. Citar calendario + título + horario.
4. No copiar descripciones sensibles al repo.

## Tools

Las que existan: `calendar_list_events`, `calendar_create_event`, `calendar_update_event`, `calendar_delete_event`, o equivalentes del plugin oficial.

## No hacer

- No commitear contextos ni cuentas GCP.
- No borrar recurrentes enteros sin avisar.
- No reinstalar `google-drive-dt`.
- No asumir Calendar conectado — opt-in.
