# Google Calendar como contexto del cerebro

Integración **opcional** vía el MCP `google-drive-dt`. Aplica cuando existe `vitals/config/calendar-context.yaml` o el usuario invocó `/calendar`.

Spec del embudo (un token, preguntar una app vs todas): `vitals/specs/google-apps-mcp.md`.

## Cuándo consultar Calendar

- El usuario pide agenda, huecos, o crear/cambiar un evento.
- Hay calendarios en `calendar-context.yaml`.

## Límites obligatorios

1. **Selective** — operar solo en `calendars[].id` registrados. `all_calendars` solo si lo pidió explícitamente.
2. **Escritura** — crear/editar si `write: true` en ese calendario y el usuario lo pidió. Borrar solo con confirmación.
3. **Charter no-secrets** — no persistir descripciones sensibles, tokens ni credenciales en Git.
4. No documentar en el repo la cuenta Google ni el proyecto OAuth.

## Referencias

- Skill: `.cursor/skills/dt-calendar/` · command `/calendar`
- Guía: `docs/02_guides/drive-cerebro-setup.md` (`DOC-GUIDE-009`)
