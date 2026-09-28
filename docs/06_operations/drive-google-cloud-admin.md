---
id: DOC-OPS-002
title: "Google Workspace — administración OAuth (Google Cloud)"
type: runbook
status: canonical
owner: dt-platform
created: 2026-07-30
updated: 2026-09-28
tags:
  - drive
  - gmail
  - calendar
  - google-cloud
  - oauth
  - security
  - mcp
domain:
  - meta
summary: Crear proyecto Google Cloud, OAuth interno y distribuir credenciales para Drive, Gmail y Calendar del DT — una sola vez por organización.
related:
  - DOC-GUIDE-009
  - DOC-OPS-001
  - DOC-OV-004
keywords:
  - google cloud
  - oauth
  - drive
  - gmail
  - calendar
  - credentials
  - workspace
priority: high
intended_audience:
  - admins
  - engineers
  - ai-agents
source_of_truth: true
review_cycle_days: 90
---

# Google Workspace — administración OAuth (Google Cloud)

## Summary

Runbook **una sola vez por organización** para que usuarios del DT conecten Drive, Gmail y/o Calendar vía el mismo MCP. El resultado es un JSON (`dt-drive-credentials.json`) por canal interno — **nunca en el repo público**. No registrar en Git cuentas, Client IDs ni IDs de proyecto reales.

## Prerequisito IT (validar primero)

En **Google Workspace Admin Console** → Seguridad → Controles de acceso y datos → Controles de API:

- Confirmar que las apps OAuth **internas** están permitidas para la organización `<TU_ORGANIZACION>`.
- Si hay restricción estricta, agregar el Client ID de la app cuando exista.

Sin esto, los usuarios verán `access_denied` aunque el setup sea correcto.

## Paso a paso — Google Cloud Console

Acceso: [console.cloud.google.com](https://console.cloud.google.com) con cuenta admin del Workspace.

### 1. Crear proyecto

| Campo | Valor a completar |
|-------|-------------------|
| Nombre del proyecto | `dt-cerebro-drive` |
| Organización | `<TU_ORGANIZACION>` |
| Ubicación | `<CARPETA_O_BILLING>` (según política de la empresa) |

### 2. Habilitar API

**APIs y servicios → Biblioteca** — habilitar las que la org vaya a usar:

| API | Para |
|-----|------|
| Google Drive API | `/drive` |
| Gmail API | `/gmail` |
| Google Calendar API | `/calendar` |

Opcional (edición rica de Docs/Sheets/Slides): Google Docs API, Google Sheets API, Google Slides API. El DT mantiene Drive en **solo lectura**.

### 3. Consentimiento OAuth (Google Auth Platform)

1. **APIs y servicios → Pantalla de consentimiento OAuth** (en consolas nuevas: **Google Auth Platform**).
2. App **Interna** (solo cuentas `@<TUEMPRESA>.com`).

| Campo | Valor a completar |
|-------|-------------------|
| Nombre de la app | `El DT — Cerebro Google` |
| Correo de asistencia | `<EMAIL_ADMIN>` |
| Dominio autorizado | `<TUEMPRESA>.com` (si aplica) |
| Correo del desarrollador | `<EMAIL_ADMIN>` |

3. **Scopes** — en la UI nueva están en **Acceso a los datos** (no en Descripción general). Agregar los que correspondan:

| Scope | App |
|-------|-----|
| `https://www.googleapis.com/auth/drive.readonly` | Drive |
| `https://www.googleapis.com/auth/gmail.readonly` | Gmail lectura |
| `https://www.googleapis.com/auth/gmail.compose` | Gmail borradores (Google no ofrece un scope “solo draft”; el MCP no envía) |
| `https://www.googleapis.com/auth/calendar` | Calendar |

4. Guardar hasta finalizar.

### 4. Crear credenciales OAuth

1. **APIs y servicios → Credenciales**
2. **Crear credenciales → ID de cliente OAuth**
3. Tipo de aplicación: **App de escritorio** (Desktop app)
4. Nombre: `dt-drive-desktop`
5. **Crear** → **Descargar JSON**

### 5. Renombrar y distribuir

| Acción | Detalle |
|--------|---------|
| Renombrar archivo descargado | `dt-drive-credentials.json` |
| Canal de distribución | 1Password / carpeta Drive restringida / wiki interna |
| **Prohibido** | Subir al repo público de El DT, Slack público, email sin cifrar |

### 6. Comunicar a usuarios

Enviar enlace al archivo + guía [drive-cerebro-setup.md](../02_guides/drive-cerebro-setup.md) (`DOC-GUIDE-009`).

**Mensaje sugerido (Cursor):**

```text
1. Descargá dt-drive-credentials.json (canal interno)
2. /yo
3. /drive, /gmail o /calendar — el DT pregunta si es una app o las tres
4. ./scripts/setup-drive.sh ~/Downloads/dt-drive-credentials.json --apps …
5. Reiniciá Cursor
```

**Mensaje sugerido (Antigravity):**

```text
1. Descargá dt-drive-credentials.json (canal interno)
2. /yo
3. /drive, /gmail o /calendar
4. ./scripts/setup-drive.sh ~/Downloads/dt-drive-credentials.json --ide antigravity --apps …
5. Reiniciá Antigravity
```

**Ambos IDEs en la misma PC:** usar `--ide all` en el paso 3.

### 7. API vs MCP en GCP / marketplace

| Qué | ¿Hace falta? |
|-----|--------------|
| **Google Drive API** (y Gmail / Calendar si aplica) | **Sí** |
| Plugin marketplace Cursor | **No** — `google-drive-dt` + Desktop OAuth |

## Qué contiene el JSON (referencia)

El archivo incluye campos como:

```json
{
  "installed": {
    "client_id": "<CLIENT_ID>.apps.googleusercontent.com",
    "client_secret": "<CLIENT_SECRET>",
    "redirect_uris": ["http://localhost"]
  }
}
```

- **client_id** — identificador público de la app (puede compartirse internamente).
- **client_secret** — distribuir solo por canal interno; nunca en Git.

## Seguridad

| Práctica | Motivo |
|----------|--------|
| Scope `drive.readonly` | El DT no escribe en Drive |
| Scopes Gmail `readonly` + `compose` | Lectura + borradores; el servidor no envía |
| Scope `calendar` | Eventos |
| App **Interna** | Sin verificación pública; solo Workspace |
| Tokens por usuario en `~/.config/` | Cada persona autoriza **su** cuenta (no la del admin GCP, salvo que sea la misma) |
| Selectores locales | Política del DT; no es un sandbox de Google |

## Rotación y revocación

| Evento | Acción |
|--------|--------|
| Filtración de client_secret | Revocar credencial en Cloud Console → crear nueva → redistribuir |
| Usuario deja la empresa | Revocar acceso en [myaccount.google.com/permissions](https://myaccount.google.com/permissions) |
| Cambio de scope | Acceso a los datos → usuarios re-autorizan con `/drive`, `/gmail` o `/calendar` |

## Verificación

1. Un usuario piloto descarga `dt-drive-credentials.json`
2. Corre `./scripts/setup-drive.sh ruta/al/dt-drive-credentials.json`
3. Completa OAuth en navegador
4. En Cursor: `/drive`, `/gmail` o `/calendar` → selector → prueba

## Related docs

- [Setup usuario — Drive / Gmail / Calendar](../02_guides/drive-cerebro-setup.md) (`DOC-GUIDE-009`)
- [Colaboración Git](git-colaboracion-dt.md) (`DOC-OPS-001`)
