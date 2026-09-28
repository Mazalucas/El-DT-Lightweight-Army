---
name: dt-gmail
description: "[Rutina] Conectar Gmail al cerebro del DT — OAuth compartido con Drive/Calendar, política de lectura, borradores. Use when the user invokes /gmail or wants the DT to search mail or leave drafts."
---

# dt-gmail

Integración **opcional** de Gmail vía el mismo MCP que Drive (`google-drive-dt`). Un token, varios scopes. Spec: `vitals/specs/google-apps-mcp.md`.

**Guías:** `docs/02_guides/drive-cerebro-setup.md` (`DOC-GUIDE-009`) · admin: `docs/06_operations/drive-google-cloud-admin.md` (`DOC-OPS-002`).

## Prerequisitos

Igual que `/drive`: sesión (`/yo`), Node 18+, JSON OAuth de la empresa, MCP en el IDE.

## Archivos

| Archivo | Git | Rol |
|---------|-----|-----|
| `~/.config/mcp-server-google-drive/oauth-credentials.json` | No | App interna (compartida) |
| `~/.config/mcp-server-google-drive/tokens.json` | No | Token de la cuenta que autorizó |
| `vitals/config/google-apps.yaml` | No | Apps habilitadas |
| `vitals/config/gmail-context.yaml` | No | Etiquetas / queries |
| `vitals/config/gmail-context.yaml.example` | Sí | Plantilla |

## Flujo `/gmail`

1. Confirmar `/yo`.
2. **Embudo** (no saltear): *¿solo Gmail o también Drive y Calendar?* Ver spec.
3. Armar `--apps` (unión con `google-apps.yaml` si ya hay otras apps).
4. `./scripts/setup-drive.sh [creds] --apps <lista> [--ide …]` — re-auth si faltan scopes.
5. Reiniciar IDE si las tools no aparecen.
6. **Selector de contexto Gmail** (abajo).
7. Actualizar `google-apps.yaml` (`gmail: true`) y `gmail-context.yaml`.

Si ya hay Gmail conectado y solo quieren cambiar etiquetas → selector, sin re-auth.

## Selector de contexto

Objetivo: no leer “todo el correo” salvo que lo pidan (`sync_mode: full_mailbox`).

1. Mostrar `gmail-context.yaml` si existe.
2. Pedir **etiquetas** (nombres) y/o queries Gmail (`from:`, `newer_than:`, `label:`) con una frase de propósito cada una.
3. Si existen tools MCP de listado/búsqueda, ayudar a elegir; si no, registrar lo que el usuario dicte.
4. Escribir el YAML (schema del `.example`). No va a Git.

## Uso diario

Cuando `gmail-context.yaml` existe y el MCP está activo:

1. Acotar búsquedas a labels/queries registradas (`selective`).
2. **Borradores** con `gmail_create_draft` — el humano envía en Gmail. Nunca `messages.send`.
3. Si no hay `gmail_search` / `gmail_get_message`, no fingir lectura del inbox.
4. No copiar hilos sensibles al repo (`vitals/charter/no-secrets.md`).
5. El token ve todo el buzón de esa cuenta; el YAML es política DT.

## Tools

| Tool | Uso |
|------|-----|
| `gmail_create_draft` | Dejar un borrador (to, subject, body) |
| `gmail_search` / `gmail_get_message` | Solo si el MCP las expone |

## No hacer

- No commitear contextos, tokens ni credenciales.
- No enviar mail.
- No asumir Gmail conectado — opt-in.
- No documentar en el repo qué cuenta o proyecto GCP se usó.
