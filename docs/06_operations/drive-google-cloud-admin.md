---
id: DOC-OPS-002
title: "Google Drive — administración OAuth (Google Cloud)"
type: runbook
status: canonical
owner: dt-platform
created: 2026-07-30
updated: 2026-07-30
tags:
  - drive
  - google-cloud
  - oauth
  - security
  - mcp
domain:
  - meta
summary: Crear proyecto Google Cloud, OAuth interno y distribuir credenciales para la integración Drive del DT — una sola vez por organización.
related:
  - DOC-GUIDE-009
  - DOC-OPS-001
  - DOC-OV-004
keywords:
  - google cloud
  - oauth
  - drive
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

# Google Drive — administración OAuth (Google Cloud)

## Summary

Runbook **una sola vez por organización** para habilitar que usuarios del DT conecten Google Drive vía MCP. El resultado es un archivo JSON (`dt-drive-credentials.json`) distribuido por canal interno — **nunca en el repo público**.

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

1. **APIs y servicios → Biblioteca**
2. Buscar **Google Drive API**
3. **Habilitar**

> Opcional para fase 2 (lectura avanzada de Docs/Sheets): habilitar también Google Docs API, Google Sheets API y Google Slides API. Para lectura básica vía export, Drive API suele alcanzar.

### 3. Pantalla de consentimiento OAuth

1. **APIs y servicios → Pantalla de consentimiento OAuth**
2. **Crear**

| Campo | Valor a completar |
|-------|-------------------|
| Tipo de usuario | **Interno** (solo cuentas `@<TUEMPRESA>.com`) |
| Nombre de la app | `El DT — Cerebro Drive` |
| Correo de asistencia | `<EMAIL_ADMIN>` |
| Logo | Opcional |
| Dominio autorizado | `<TUEMPRESA>.com` (si aplica) |
| Correo del desarrollador | `<EMAIL_ADMIN>` |

3. **Scopes → Agregar o quitar scopes**
4. Agregar: `https://www.googleapis.com/auth/drive.readonly` — **Ver y descargar todos tus archivos de Google Drive**

5. **Guardar y continuar** hasta finalizar.

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
3. ./scripts/setup-drive.sh ~/Downloads/dt-drive-credentials.json
4. Reiniciá Cursor → /drive → elegí carpetas
```

**Mensaje sugerido (Antigravity):**

```text
1. Descargá dt-drive-credentials.json (canal interno)
2. /yo
3. ./scripts/setup-drive.sh ~/Downloads/dt-drive-credentials.json --ide antigravity
4. Reiniciá Antigravity → /drive → elegí carpetas
```

**Ambos IDEs en la misma PC:** usar `--ide all` en el paso 3.

### 7. API vs MCP en GCP / marketplace

| Qué | ¿Hace falta? |
|-----|--------------|
| **Google Drive API** en GCP | **Sí** — habilitada en el proyecto |
| Plugin "Google Drive MCP" del marketplace Cursor | **No** — usamos `google-drive-dt` + credenciales Desktop |

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
| Scope `drive.readonly` | El DT no escribe en Drive en fase 1 |
| App **Interna** | Sin verificación pública de Google; solo cuentas del Workspace |
| Tokens por usuario en `~/.config/` | Cada persona autoriza su cuenta; permisos = los de su Drive |
| Registro de carpetas local | Política del DT; limita consultas a lo elegido |

## Rotación y revocación

| Evento | Acción |
|--------|--------|
| Filtración de client_secret | Revocar credencial en Cloud Console → crear nueva → redistribuir |
| Usuario deja la empresa | Revocar acceso en [myaccount.google.com/permissions](https://myaccount.google.com/permissions) |
| Cambio de scope | Actualizar consent screen → usuarios re-autorizan con `/drive` |

## Verificación

1. Un usuario piloto descarga `dt-drive-credentials.json`
2. Corre `./scripts/setup-drive.sh ruta/al/dt-drive-credentials.json`
3. Completa OAuth en navegador
4. En Cursor: `/drive` → selector de carpetas → pregunta de prueba al DT

## Related docs

- [Setup usuario — Drive cerebro](../02_guides/drive-cerebro-setup.md) (`DOC-GUIDE-009`)
- [Colaboración Git](git-colaboracion-dt.md) (`DOC-OPS-001`)
