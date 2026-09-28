# Gmail como contexto del cerebro

Integración **opcional** vía el MCP `google-drive-dt`. Aplica cuando existe `vitals/config/gmail-context.yaml` o el usuario invocó `/gmail`.

Spec del embudo (un token, preguntar una app vs todas): `vitals/specs/google-apps-mcp.md`.

## Cuándo consultar Gmail

- El usuario pide hilos, seguimiento de mails o dejar un borrador.
- Hay labels/queries en `gmail-context.yaml`.

## Límites obligatorios

1. **Selective** — con `sync_mode: selective`, acotar a labels/queries registradas. `full_mailbox` solo si lo pidió explícitamente.
2. **No enviar** — `gmail_create_draft` como máximo. El humano envía en Gmail.
3. **Tools reales** — si no hay `gmail_search` / `gmail_get_message`, no inventar el contenido del inbox.
4. **Charter no-secrets** — no persistir hilos, tokens ni credenciales en Git (`vitals/charter/no-secrets.md`).
5. No documentar en el repo la cuenta Google ni el proyecto OAuth.

## Referencias

- Skill: `.cursor/skills/dt-gmail/` · command `/gmail`
- Guía: `docs/02_guides/drive-cerebro-setup.md` (`DOC-GUIDE-009`)
