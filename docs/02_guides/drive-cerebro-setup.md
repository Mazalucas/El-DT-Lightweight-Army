---
id: DOC-GUIDE-009
title: "Google Drive, Gmail y Calendar como cerebro — setup para usuarios"
type: guide
status: canonical
owner: dt-platform
created: 2026-07-30
updated: 2026-09-28
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
summary: Conectar Drive, Gmail o Calendar al DT — un OAuth, MCP por IDE, preguntar una app o las tres, selectores locales sin Git.
related:
  - DOC-OPS-002
  - DOC-GUIDE-001
  - DOC-OV-004
  - DOC-GUIDE-006
  - DOC-OPS-001
keywords:
  - drive
  - gmail
  - calendar
  - google
  - mcp
  - cerebro
  - carpetas
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

Conectá Drive, Gmail y/o Calendar para que el DT los consulte (y, en Calendar, cree eventos; en Gmail, deje **borradores**). **Un solo login de Google.** En `/drive`, `/gmail` o `/calendar` el DT **pregunta siempre** si autorizás solo esa app o las tres. Credenciales de la empresa fuera del repo; selectores solo en tu PC.

**No confundir:** en Google Cloud habilitás las APIs (Drive, y si aplica Gmail y Calendar). No hace falta el plugin "Google Drive MCP" del marketplace de Cursor — usamos `google-drive-dt` (`npx @ibarcarty/mcp-server-google-drive`).

Spec interno: `vitals/specs/google-apps-mcp.md`.

## Qué instala el setup (4 capas)

| Capa | Qué es | ¿Por persona? | ¿Dónde vive? |
|------|--------|---------------|--------------|
| 1. Credenciales OAuth | JSON de la app interna de la empresa | No — una para todos | Canal interno → `~/.config/mcp-server-google-drive/oauth-credentials.json` |
| 2. Login Google | Token de **tu** cuenta (la que hace clic en el consentimiento) | Sí | `~/.config/mcp-server-google-drive/tokens.json` |
| 3. MCP en el IDE | Cómo arrancar el servidor | Sí — por IDE | Cursor: `~/.cursor/mcp.json` · Antigravity: `~/.gemini/config/mcp_config.json` |
| 4. Selectores | Carpetas / etiquetas / calendarios | Sí | `vitals/config/*-context.yaml` + `google-apps.yaml` (local, no Git) |

El MCP **no se clona al repo**: corre con `npx`. No hace falta desplegar Cloud Run para uso en el IDE.

## Embudo (una app o las tres)

Al invocar `/drive`, `/gmail` o `/calendar` el DT pregunta si el acceso es **solo esa app** o **las tres**. Después:

```bash
./scripts/setup-drive.sh ruta/al/dt-drive-credentials.json --apps drive
./scripts/setup-drive.sh --apps gmail
./scripts/setup-drive.sh --apps calendar
./scripts/setup-drive.sh --apps all
```

`--apps` se puede combinar (`drive,gmail`). Si el token no tiene esos scopes, se reabre el navegador.

Drive en el DT queda **solo lectura**. Gmail: lectura (si el MCP trae esas tools) + borradores, **sin enviar**. Calendar: leer y escribir eventos.

## Antes de empezar

| Requisito | Quién lo provee |
|-----------|-----------------|
| Cuenta Google de la empresa (`@<TUEMPRESA>.com`) | Tu organización |
| Archivo `dt-drive-credentials.json` | Admin / IT (1Password o Drive restringido) |
| Node.js 18+ | Instalación local (`node -v`) |
| Sesión DT | `/yo` en Cursor o Antigravity |

**Admin:** proyecto OAuth en GCP → [drive-google-cloud-admin.md](../06_operations/drive-google-cloud-admin.md) (`DOC-OPS-002`).

---

## Opción A — Cursor

### Tarjeta rápida

```text
1. Descargá dt-drive-credentials.json (canal interno)
2. /yo
3. /drive (o /gmail o /calendar) — el DT pregunta si es una app o las tres
4. ./scripts/setup-drive.sh ruta/al/dt-drive-credentials.json --apps …
5. Reiniciá Cursor
6. Completá el selector de esa app
```

### Detalle paso a paso

1. **Credenciales** — guardá el JSON en un lugar seguro (Downloads, 1Password, etc.).
2. **Identidad** — en el chat: `/yo` → "Soy Ana García, rol …".
3. **Setup** — en terminal, desde la raíz del repo:

   ```bash
   ./scripts/setup-drive.sh ~/Downloads/dt-drive-credentials.json --apps drive
   ```

   El script:
   - Copia credenciales a `~/.config/` (chmod 600)
   - Abre el navegador para login Google (scopes según `--apps`)
   - Registra `google-drive-dt` en `~/.cursor/mcp.json`

4. **Reiniciar Cursor** — Settings → MCP → `google-drive-dt` en verde.
5. **Selector** — `/drive` (carpetas), `/gmail` (etiquetas) o `/calendar` (calendarios).

### Verificar en Cursor

Settings → MCP → servidor **`google-drive-dt`** activo (indicador verde).

---

## Opción B — Antigravity

El command **`/drive`** (y `/gmail`, `/calendar`) y las skills **`dt-drive`**, **`dt-gmail`**, **`dt-calendar`** ya están en el repo. El OAuth es el mismo; solo cambia dónde se registra el MCP.

### Tarjeta rápida

```text
1. Descargá dt-drive-credentials.json (canal interno)
2. /yo
3. ./scripts/setup-drive.sh ruta/al/dt-drive-credentials.json --ide antigravity --apps drive
   (o --ide all si también usás Cursor)
4. Reiniciá Antigravity
5. /drive → elegí carpetas
```

### Detalle paso a paso

1. **Credenciales + OAuth** — mismo script que Cursor:

   ```bash
   ./scripts/setup-drive.sh ~/Downloads/dt-drive-credentials.json --ide antigravity --apps drive
   ```

   Escribe en `~/.gemini/config/mcp_config.json` (Antigravity 2.0+). Si tu versión es anterior, el script también prueba `~/.gemini/antigravity/mcp_config.json`.

2. **Verificar MCP en Antigravity** — panel del agente → **⋯** → **Manage MCP Servers** → **View raw config**. Debe aparecer `google-drive-dt`.

3. **Alternativa manual** — si el script no encuentra tu ruta de config, pegá este bloque en el JSON de MCP (ajustá `<usuario>`):

   ```json
   "google-drive-dt": {
     "command": "npx",
     "args": ["-y", "@ibarcarty/mcp-server-google-drive"],
     "env": {
       "GDRIVE_MCP_OAUTH_PATH": "/Users/<usuario>/.config/mcp-server-google-drive/oauth-credentials.json",
       "GDRIVE_MCP_TOKEN_PATH": "/Users/<usuario>/.config/mcp-server-google-drive/tokens.json",
       "GDRIVE_MCP_SCOPES": "https://www.googleapis.com/auth/drive.readonly"
     }
   }
   ```

   `GDRIVE_MCP_SCOPES` es una lista separada por comas. El script la arma según `--apps` (Drive, Gmail, Calendar). No pongas secretos ni IDs de proyecto en el repo.

4. **Reiniciar Antigravity** tras guardar la config.

5. **Selector** — `/drive`, `/gmail` o `/calendar`.

### Rutas MCP Antigravity (referencia)

| Versión / alcance | Archivo |
|-------------------|---------|
| Global (2.0+, recomendado) | `~/.gemini/config/mcp_config.json` |
| Global (legacy pre-2.0) | `~/.gemini/antigravity/mcp_config.json` |
| Solo este proyecto | `.agents/mcp_config.json` en la raíz del repo |

Para equipos: preferí **global** (`~/.gemini/config/`) para no commitear config personal.

---

## Opción C — Cursor y Antigravity en la misma máquina

```bash
./scripts/setup-drive.sh ~/Downloads/dt-drive-credentials.json --ide all --apps drive
```

OAuth y credenciales son **una sola vez**; el script registra el MCP en ambos IDEs. Reiniciá **ambos** clientes.

---

## Selectores (`/drive`, `/gmail`, `/calendar`)

**Drive:** unidades compartidas y carpetas raíz; propósito por carpeta; `drive-context.yaml`. `full_drive` solo si lo pedís.

**Gmail:** etiquetas y/o queries; `gmail-context.yaml`. `full_mailbox` solo si lo pedís. El DT no envía mail.

**Calendar:** por defecto `primary`; IDs extra si los pegás; `calendar-context.yaml`.

Nada de eso va a GitHub. También se actualiza `google-apps.yaml`.

## Uso diario (después del setup)

- Drive: *“según el brief en Drive…”* — regla `18-drive-contexto`.
- Gmail: *“dejame un borrador a…”* / búsqueda si el MCP tiene tools de lectura — regla `19-gmail-contexto`.
- Calendar: *“qué tengo mañana”* / *“agendá 30 min…”* — regla `21-calendar-contexto`.

## Qué NO se comparte

| Dato | ¿Va al repo público? |
|------|----------------------|
| Credenciales OAuth de la empresa | **No** |
| Tu token de Google | **No** |
| Carpetas, etiquetas, calendarios elegidos | **No** |
| Contenido de archivos, mails o eventos | **No** — bajo demanda |
| Cuenta o proyecto GCP usados en esta máquina | **No** |

## Cambiar selectores / desvincular

| Acción | Cómo |
|--------|------|
| Agregar o quitar carpetas / labels / calendarios | El command de esa app de nuevo |
| Desvincular cuenta | Borrar `tokens.json` y los YAML locales (`drive-context`, `gmail-context`, `calendar-context`, `google-apps`) |
| Rotar credenciales empresa | Admin regenera secret en GCP → redistribuir JSON |

## Problemas frecuentes

| Problema | Solución |
|----------|----------|
| No aparecen tools de Drive | Reiniciar IDE; verificar MCP config del IDE |
| `access_denied` en login | App OAuth interna + IT — `DOC-OPS-002` |
| Carpeta no listada | Tu cuenta no tiene permiso en Drive |
| Antigravity no ve el servidor | Manage MCP Servers → raw config; usar `--ide antigravity` |
| Cursor OK, Antigravity no | Correr setup con `--ide all` |

## Related docs

- [Admin Google Cloud — OAuth](../06_operations/drive-google-cloud-admin.md) (`DOC-OPS-002`)
- [Multi-IDE — Cursor y Antigravity](ide-setup.md) (`DOC-GUIDE-001`)
- [Cerebro equipo — mecanismos DT](../00_overview/cerebro-equipo-mecanismos-dt.md) (`DOC-OV-004`)
