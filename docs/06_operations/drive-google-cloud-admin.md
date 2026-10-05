---
id: DOC-OPS-002
title: "Google Workspace — permitir los MCP oficiales (Cursor / Antigravity / Claude)"
type: runbook
status: canonical
owner: dt-platform
created: 2026-07-30
updated: 2026-10-02
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
summary: Qué tiene que habilitar IT para que el DT use los MCP oficiales de Google — plugins Cursor o MCP remoto Workspace. Sin servidor propio ni JSON Desktop.
related:
  - DOC-GUIDE-009
  - DOC-OPS-001
  - DOC-OV-004
  - DOC-DEC-006
keywords:
  - google cloud
  - oauth
  - drive
  - gmail
  - calendar
  - marketplace
  - workspace
priority: high
intended_audience:
  - admins
  - engineers
  - ai-agents
source_of_truth: true
review_cycle_days: 90
---

# Google Workspace — permitir los MCP oficiales

## Summary

El DT **ya no** distribuye un JSON OAuth Desktop ni mantiene `google-drive-dt`. IT habilita las apps oficiales (Cursor y/o MCP remoto de Google) para que cada persona conecte Drive, Gmail y Calendar desde `/drive`, `/gmail`, `/calendar`.

No registrar en Git cuentas, Client IDs ni IDs de proyecto.

ADR: `DOC-DEC-006`. Guía usuario: `DOC-GUIDE-009`.

## Prerequisito — Admin Console

**Google Workspace Admin** → Seguridad → Controles de acceso y datos → Controles de API:

- Permitir las apps OAuth de **Cursor** (plugins Gmail / Drive / Calendar) para el dominio.
- Si van a usar Antigravity o Claude: permitir el client OAuth **web** del MCP remoto de Google Workspace (el que cree IT, interno).
- Si hay lista de allow: agregar esos Client IDs cuando existan. Sin esto, `access_denied`.

No documentar los IDs reales en este repo.

## Camino A — Solo Cursor (el más simple)

No hace falta un proyecto GCP de la empresa ni credenciales para el usuario.

1. Confirmar el allow de las apps Cursor (arriba).
2. Comunicar: `/yo` → `/drive` / `/gmail` / `/calendar` → aceptar el plugin del marketplace → login Google.
3. Listo. Cada persona autoriza **su** cuenta.

## Camino B — Antigravity o Claude (MCP remoto Google)

Developer Preview. Guía canónica de Google: [Configure the Google Workspace MCP servers](https://developers.google.com/workspace/guides/configure-mcp-servers).

En el proyecto GCP de la **organización** (no en el repo):

1. Habilitar las APIs de producto que vayan a usar: Drive, Gmail, Calendar (y Docs/Sheets/Slides si aplica).
2. Habilitar los servicios MCP: Gmail MCP API, Drive MCP API, Calendar MCP API (nombres en la consola / `gcloud services enable …mcp.googleapis.com`).
3. Consentimiento OAuth **interno**, scopes según la doc de Google para esos servidores (no copiar la lista viva acá: se desactualiza).
4. Client OAuth tipo **Aplicación web**, con los redirect URI que pida el IDE (Antigravity y Claude publican los suyos en esa guía).
5. Entregar Client ID/secret por canal interno. **Nunca** al repo público.

El DT ayuda a pegar las URLs (`drivemcp` / `gmailmcp` / `calendarmcp`) en la config del IDE. No commitear el secret.

## Qué decirle a la gente

**Cursor:**

```text
1. /yo
2. /drive, /gmail o /calendar — el DT pregunta si es una app o las tres
3. Aceptá el plugin del marketplace
4. Autenticá tu cuenta Google
```

**Antigravity / Claude:**

```text
1. Pedile a IT el alta del MCP remoto (este runbook, camino B)
2. /yo → /drive /gmail /calendar
3. Completá OAuth en el IDE
```

## Seguridad (postura DT)

| Práctica | Motivo |
|----------|--------|
| Drive solo lectura en skills | El plugin oficial puede crear archivos; el DT no las usa |
| Gmail sin send en skills | Cursor Gmail puede enviar; el humano envía el borrador |
| App interna / allow de dominio | Solo cuentas de la org |
| Selectores locales | Política DT; no es un sandbox de Google |
| Sin JSON en Git | Nada de `dt-drive-credentials.json` en el framework |

## Legado (descontinuado)

Si la org todavía tiene un Desktop OAuth y `google-drive-dt` en `mcp.json`:

1. Conectar el oficial.
2. `./scripts/setup-drive.sh --remove-legacy`
3. Dejar de distribuir `dt-drive-credentials.json`.
4. Cada persona puede borrar `~/.config/mcp-server-google-drive/` en su máquina.
5. Revocar el client Desktop viejo en Cloud Console cuando nadie lo use.

## Rotación

| Evento | Acción |
|--------|--------|
| Alguien deja la empresa | Revocar la app en la cuenta Google / Admin |
| Filtración de client web (camino B) | Rotar secret en GCP; no está en Git |
| Usuario quiere desconectar | Cerrar sesión del plugin / conector |

## Verificación

1. Piloto en Cursor: `/gmail` → plugin → busca un hilo de prueba → deja un **borrador** (no enviar).
2. Si aplica Antigravity: mismas tools vía MCP remoto.
3. Confirmá que `google-drive-dt` ya no está en la config MCP.

## Related docs

- [Setup usuario](../02_guides/drive-cerebro-setup.md) (`DOC-GUIDE-009`)
- [ADR-006](../05_decisions/adr-006-mcp-google-oficial.md) (`DOC-DEC-006`)
- [Colaboración Git](git-colaboracion-dt.md) (`DOC-OPS-001`)
