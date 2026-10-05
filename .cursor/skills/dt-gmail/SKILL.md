---
name: dt-gmail
description: "[Rutina] Conectar Gmail al cerebro del DT — marketplace oficial del IDE, etiquetas, borradores en hilo. Use when the user invokes /gmail or wants the DT to search mail or leave drafts."
---

# dt-gmail

Integración **opcional** de Gmail vía el **MCP oficial del IDE**. `google-drive-dt` está descontinuado.

**Spec:** `vitals/specs/google-apps-mcp.md`. **Guía usuario:** `docs/02_guides/drive-cerebro-setup.md` (`DOC-GUIDE-009`). **ADR:** `DOC-DEC-006`.

No abras el runbook de IT ni fichas de Google Cloud en este chat.

## Prerequisitos

Sesión (`/yo`). Plugin, MCP Store o conector oficial de Gmail. Sin JSON Desktop ni Node.

## Archivos

| Archivo | Git | Rol |
|---------|-----|-----|
| `vitals/config/google-apps.yaml` | No | Apps habilitadas |
| `vitals/config/gmail-context.yaml` | No | Etiquetas / queries |
| `vitals/config/gmail-context.yaml.example` | Sí | Plantilla |

## Flujo `/gmail`

1. Confirmar `/yo`.
2. **Embudo:** *¿solo Gmail o también Drive y Calendar?*
3. **Instalar el oficial** con el procedimiento único de `vitals/specs/google-apps-mcp.md` § Instalar. Slug en Cursor: `gmail`. Marketplace / Store primero. No recorras Google Cloud Console.
4. Esperar tools de búsqueda/lectura/draft. Si no hay, **Freno** — no inventar el inbox.
5. **Selector de contexto.** Actualizar `google-apps.yaml` (`gmail: true`) y `gmail-context.yaml`.
6. Legado `google-drive-dt` → ofrecer `--remove-legacy` cuando el oficial ya lea mail.

Si solo quieren cambiar etiquetas y Gmail ya está → selector.

## Freno

Si no hay tools o no aparece **Authenticate**:

1. Parar. No seguir al selector. No inventar el inbox.
2. No recorras Google Cloud Console.
3. No abras el runbook de IT. No armes un JSON con `clientId`.
4. Decí solo: *Falta el client OAuth de la organización. Pedíselo a IT. Si no hay IT, usá la documentación oficial de Google Workspace MCP en tu navegador. El DT no recorre Google Cloud Console ni pega secrets.*

## Selector de contexto

No leer “todo el correo” salvo `sync_mode: full_mailbox` pedido explícito.

1. Mostrar `gmail-context.yaml` si existe.
2. Pedir etiquetas y/o queries (`from:`, `newer_than:`, `label:`) con propósito.
3. Si hay `list_labels` / `list_email_labels`, ayudar a elegir.
4. Escribir el YAML (schema del `.example`). No va a Git.

## Uso diario

1. Acotar a labels/queries (`selective`).
2. **Borradores** — `create_draft` / `draft_email` / `gmail_create_draft`. Reply en cadena: `replyToMessageId` o `threadId` + `inReplyTo`. El humano envía en Gmail.
3. **Etiquetar** mails/hilos existentes si lo piden. Crear label nuevo solo con pedido explícito y tool real.
4. **Nunca enviar** — no `send_email`, no `messages.send`, no `drafts.send`.
5. No copiar hilos sensibles al repo.
6. El token ve todo el buzón; el YAML es política DT.

## Tools

Usar las que existan (spec). Típico oficial Google: `search_threads`, `get_thread`, `create_draft`, `list_labels`, `label_message`, `label_thread`. Cursor puede exponer nombres distintos (`search_emails`, `read_email`, `draft_email`).

## Errores frecuentes

| Síntoma | Acción |
|---------|--------|
| Plugin cancelado | No seguir al selector. Ofrecer `/add-plugin gmail` |
| `needsAuth` | El operador autentica el plugin; no fingir el inbox |
| Antigravity o Claude sin Authenticate | **Freno.** No caer a `google-drive-dt` |

## No hacer

- No commitear contextos ni cuentas GCP.
- No enviar mail.
- No reinstalar `google-drive-dt`.
- No asumir Gmail conectado — opt-in.
- No dictar el alta en Cloud.
