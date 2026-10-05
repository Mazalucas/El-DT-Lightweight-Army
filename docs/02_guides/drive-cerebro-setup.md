---
id: DOC-GUIDE-009
title: "Google Drive, Gmail y Calendar como cerebro — setup para usuarios"
type: guide
status: canonical
owner: dt-platform
created: 2026-07-30
updated: 2026-10-05
tags:
  - drive
  - gmail
  - calendar
  - google
  - onboarding
  - cerebro
  - mcp
  - antigravity
  - cursor
domain:
  - meta
summary: Conectar Drive, Gmail o Calendar al DT desde el marketplace o Store oficial del IDE. Si Authenticate no aparece, parar; el DT no recorre Cloud Console.
related:
  - DOC-OPS-002
  - DOC-GUIDE-001
  - DOC-OV-004
  - DOC-GUIDE-006
  - DOC-OPS-001
  - DOC-DEC-006
keywords:
  - drive
  - gmail
  - calendar
  - google
  - mcp
  - cerebro
  - marketplace
  - antigravity
  - cursor
priority: high
intended_audience:
  - non-developers
  - engineers
  - ai-agents
source_of_truth: true
review_cycle_days: 90
---

# Google Drive, Gmail y Calendar como cerebro — setup para usuarios

## Summary

Conectá Drive, Gmail y/o Calendar para que el DT los consulte (Calendar: crear eventos; Gmail: **borradores**, también en una cadena; etiquetas). El DT usa el **MCP oficial de tu IDE** (marketplace, MCP Store o Connectors), no un servidor propio.

En `/drive`, `/gmail` o `/calendar` el DT **pregunta si autorizás solo esa app o las tres**. Los selectores quedan en tu PC; no van a Git.

Spec: `vitals/specs/google-apps-mcp.md`. Decisión: `DOC-DEC-006`.

**Descontinuado:** `google-drive-dt` / `@ibarcarty/mcp-server-google-drive` / `dt-drive-credentials.json`. Si todavía lo tenés, autenticá el oficial y corré `./scripts/setup-drive.sh --remove-legacy`.

## Qué queda en tu máquina

| Capa | Qué es | ¿Por persona? | ¿Dónde vive? |
|------|--------|---------------|--------------|
| 1. Plugin o conector | MCP oficial del IDE | Sí | Cursor: marketplace · Antigravity: MCP Store / Marketplace · Claude: Connectors |
| 2. Login Google | Consentimiento de **tu** cuenta | Sí | Lo guarda el IDE / Google |
| 3. Selectores | Carpetas / etiquetas / calendarios | Sí | `vitals/config/*-context.yaml` + `google-apps.yaml` (local, no Git) |

## Embudo (una app o las tres)

Al invocar `/drive`, `/gmail` o `/calendar` el DT pregunta si el acceso es **solo esa app** o **las tres**. Después instala el plugin o el conector **del marketplace / Store** de ese IDE.

Postura del DT (aunque el oficial permita más):

- Drive: **solo lectura**
- Gmail: leer, borrador (incl. reply), etiquetar; **no envía**
- Calendar: leer y escribir eventos; borrar solo si lo confirmás

## Antes de empezar

| Requisito | Quién |
|-----------|--------|
| Cuenta Google de trabajo | Tu organización |
| IDE con marketplace o conector MCP | Cursor, Antigravity o Claude |
| Sesión DT | `/yo` |

**IT / Workspace:** permitir las apps oficiales. Si usás Antigravity o Claude y no aparece Authenticate, el alta del client es de IT (fuera de este chat).

---

## El mismo flujo en todos los IDE

```text
1. /yo
2. /drive, /gmail o /calendar — el DT pregunta si es una app o las tres
3. Instalá el conector oficial de ese IDE (tabla)
4. Autenticá tu cuenta Google
5. Completá el selector
```

| IDE | Conector oficial |
|-----|------------------|
| Cursor | Marketplace: `/add-plugin google-drive` · `gmail` · `google-calendar` |
| Antigravity | Customizations → Marketplace, o Settings → Add MCP / MCP Servers. Buscar Gmail, Drive, Calendar |
| Claude | Settings → Connectors. Conector oficial si existe; si no, la URL remota de Google. Plan con conectores |

Spec para la IA: `vitals/specs/google-apps-mcp.md`.

### Si no aparece Authenticate

Pará. No armes un proyecto en Google Cloud ni un client OAuth en este chat. En Antigravity y Claude Google puede pedir un client que **IT crea una vez** para la organización. Cuando te lo pasen, pegalo en tu config local. No lo subas al repo.

En Cursor ese paso no existe: el marketplace autentica solo.

Si no hay IT, abrí en el navegador la documentación oficial de Google Workspace MCP. El DT no recorre esos pasos.

### Verificar

El plugin o el servidor de esa app está autenticado. **`google-drive-dt` no debería estar.**

---

## Selectores (`/drive`, `/gmail`, `/calendar`)

**Drive:** unidades compartidas y carpetas raíz; propósito por carpeta; `drive-context.yaml`. `full_drive` solo si lo pedís.

**Gmail:** etiquetas y/o queries; `gmail-context.yaml`. `full_mailbox` solo si lo pedís. El DT no envía mail.

**Calendar:** por defecto `primary`; IDs extra si los pegás; `calendar-context.yaml`.

Nada de eso va a GitHub. También se actualiza `google-apps.yaml`.

## Uso diario

- Drive: *“según el brief en Drive…”* — regla `18-drive-contexto`.
- Gmail: *“respondé este hilo en un borrador”* / *“etiquetá…”* — regla `19-gmail-contexto`.
- Calendar: *“qué tengo mañana”* / *“agendá 30 min…”* — regla `21-calendar-contexto`.

## Qué NO se comparte

| Dato | ¿Va al repo público? |
|------|----------------------|
| Tokens o Client IDs | **No** |
| Carpetas, etiquetas, calendarios elegidos | **No** |
| Contenido de archivos, mails o eventos | **No** — bajo demanda |
| Cuenta o proyecto GCP | **No** |

## Cambiar selectores / desvincular

| Acción | Cómo |
|--------|------|
| Agregar o quitar carpetas / labels / calendarios | El command de esa app de nuevo |
| Desvincular cuenta | Cerrar sesión en el plugin o conector del IDE; vaciar los YAML locales si querés |
| Sacar el MCP viejo | `./scripts/setup-drive.sh --remove-legacy` |

## Problemas frecuentes

| Problema | Solución |
|----------|----------|
| No aparecen tools | Autenticar el plugin; reiniciar el IDE |
| Cursor: plugin cancelado | `/add-plugin …` a mano o repetir el command |
| No aparece Authenticate | Falta el client de IT. No crear un proyecto Cloud en el chat. No reinstalar `google-drive-dt` |
| Siguen tools del MCP viejo | `--remove-legacy` cuando el oficial ya funciona |
| `access_denied` | Workspace no permite la app oficial — IT |

## Related docs

- [Admin Workspace / Google Cloud](../06_operations/drive-google-cloud-admin.md) (`DOC-OPS-002`) — solo IT, no el chat de `/gmail`
- [Multi-IDE](ide-setup.md) (`DOC-GUIDE-001`)
- [Cerebro equipo](../00_overview/cerebro-equipo-mecanismos-dt.md) (`DOC-OV-004`)
- [ADR-006](../05_decisions/adr-006-mcp-google-oficial.md) (`DOC-DEC-006`)
