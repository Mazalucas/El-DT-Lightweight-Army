---
name: dt-calendar
description: "[Rutina] Conectar Google Calendar al cerebro del DT — marketplace oficial del IDE, calendarios, eventos. Use when the user invokes /calendar or wants the DT to list or create calendar events."
---

# dt-calendar

Integración **opcional** de Calendar vía el **MCP oficial del IDE**. `google-drive-dt` está descontinuado.

**Spec:** `vitals/specs/google-apps-mcp.md`. **Guía usuario:** `docs/02_guides/drive-cerebro-setup.md` (`DOC-GUIDE-009`). **ADR:** `DOC-DEC-006`.

No abras el runbook de IT ni fichas de Google Cloud en este chat.

## Prerequisitos

Sesión (`/yo`). Plugin, MCP Store o conector oficial de Calendar. Sin JSON Desktop ni Node.

## Archivos

| Archivo | Git | Rol |
|---------|-----|-----|
| `vitals/config/google-apps.yaml` | No | Apps habilitadas |
| `vitals/config/calendar-context.yaml` | No | Calendarios + zona horaria |
| `vitals/config/calendar-context.yaml.example` | Sí | Plantilla |

## Flujo `/calendar`

1. Confirmar `/yo`.
2. **Embudo:** *¿solo Calendar o también Drive y Gmail?*
3. **Instalar el oficial** con el procedimiento único de `vitals/specs/google-apps-mcp.md` § Instalar. Slug en Cursor: `google-calendar`. Marketplace / Store primero. No recorras Google Cloud Console.
4. Esperar tools de listar/crear eventos. Si no hay, **Freno**.
5. **Selector de calendarios.** `google-apps.yaml` (`calendar: true`) + `calendar-context.yaml`.
6. Legado `google-drive-dt` → `--remove-legacy` cuando el oficial liste eventos.

Si solo quieren cambiar calendarios → selector.

## Freno

Si no hay tools o no aparece **Authenticate**:

1. Parar. No seguir al selector. No inventar la agenda.
2. No recorras Google Cloud Console.
3. No abras el runbook de IT. No armes un JSON con `clientId`.
4. Decí solo: *Falta el client OAuth de la organización. Pedíselo a IT. Si no hay IT, usá la documentación oficial de Google Workspace MCP en tu navegador. El DT no recorre Google Cloud Console ni pega secrets.*

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

## Errores frecuentes

| Síntoma | Acción |
|---------|--------|
| Plugin cancelado | No seguir al selector. Ofrecer `/add-plugin google-calendar` |
| `needsAuth` | El operador autentica el plugin; no fingir la agenda |
| Antigravity o Claude sin Authenticate | **Freno.** No caer a `google-drive-dt` |

## No hacer

- No commitear contextos ni cuentas GCP.
- No borrar recurrentes enteros sin avisar.
- No reinstalar `google-drive-dt`.
- No asumir Calendar conectado — opt-in.
- No dictar el alta en Cloud.
