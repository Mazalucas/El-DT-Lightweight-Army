# Gmail como contexto del cerebro

Integración **opcional** vía el MCP **oficial del IDE**. Aplica cuando existe `vitals/config/gmail-context.yaml` o el usuario invocó `/gmail`.

`google-drive-dt` está descontinuado. Spec: `vitals/specs/google-apps-mcp.md`.

## Cuándo consultar Gmail

- El usuario pide hilos, seguimiento de mails, un borrador (también en cadena) o etiquetar.
- Hay labels/queries en `gmail-context.yaml`.

## Límites obligatorios

1. **Selective** — con `sync_mode: selective`, acotar a labels/queries registradas. `full_mailbox` solo si lo pidió explícitamente.
2. **No enviar** — borrador como máximo (`create_draft` / `draft_email`, con `replyToMessageId` o `threadId` si es reply). El humano envía en Gmail. Nunca `send` / `messages.send`.
3. **Etiquetas** — aplicar labels existentes si lo pide. Crear una label nueva solo con pedido explícito y tool real.
4. **Tools reales** — si no hay búsqueda/lectura, no inventar el inbox.
5. **Charter no-secrets** — no persistir hilos, tokens ni credenciales en Git (`vitals/charter/no-secrets.md`).
6. No documentar en el repo la cuenta Google ni el proyecto OAuth.

## Referencias

- Skill: `.cursor/skills/dt-gmail/` · command `/gmail`
- Guía: `docs/02_guides/drive-cerebro-setup.md` (`DOC-GUIDE-009`)
