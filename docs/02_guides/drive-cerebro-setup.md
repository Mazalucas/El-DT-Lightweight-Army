---
id: DOC-GUIDE-009
title: "Google Drive como cerebro — setup para usuarios"
type: guide
status: canonical
owner: dt-platform
created: 2026-07-30
updated: 2026-07-30
tags:
  - drive
  - google
  - onboarding
  - cerebro
  - mcp
  - antigravity
  - cursor
domain:
  - meta
summary: Conectar Google Drive al DT — OAuth, MCP por IDE (Cursor o Antigravity), selector de carpetas y consulta de contexto sin Git.
related:
  - DOC-OPS-002
  - DOC-GUIDE-001
  - DOC-OV-004
  - DOC-GUIDE-006
  - DOC-OPS-001
keywords:
  - drive
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

# Google Drive como cerebro — setup para usuarios

## Summary

Conectá **solo las carpetas que elijas** de tu Google Drive para que el DT las consulte como contexto. No hace falta Git ni mover archivos. Credenciales de la empresa se instalan **fuera del repo**; tu selección de carpetas queda **solo en tu PC**.

**No confundir:** en Google Cloud habilitás la **Google Drive API**. No hace falta instalar el plugin "Google Drive MCP" del marketplace de Cursor — usamos el servidor MCP del DT (`google-drive-dt`) con credenciales Desktop de tu empresa.

## Qué instala `/drive` (4 capas)

| Capa | Qué es | ¿Por persona? | ¿Dónde vive? |
|------|--------|---------------|--------------|
| 1. Credenciales OAuth | JSON de la app interna de la empresa | No — una para todos | Canal interno → `~/.config/mcp-server-google-drive/oauth-credentials.json` |
| 2. Login Google | Token de **tu** cuenta (solo lectura) | Sí | `~/.config/mcp-server-google-drive/tokens.json` |
| 3. MCP en el IDE | Le dice al IDE cómo arrancar el servidor Drive | Sí — por IDE | Cursor: `~/.cursor/mcp.json` · Antigravity: `~/.gemini/config/mcp_config.json` |
| 4. Selector de carpetas | Qué carpetas compartís al cerebro | Sí | `vitals/config/drive-context.yaml` (local, no Git) |

El MCP **no se clona al repo**: corre con `npx` cuando el IDE lo necesita.

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
3. ./scripts/setup-drive.sh ruta/al/dt-drive-credentials.json
4. Reiniciá Cursor
5. /drive → elegí carpetas y describí qué hay en cada una
```

### Detalle paso a paso

1. **Credenciales** — guardá el JSON en un lugar seguro (Downloads, 1Password, etc.).
2. **Identidad** — en el chat: `/yo` → "Soy Ana García, rol …".
3. **Setup** — en terminal, desde la raíz del repo:

   ```bash
   ./scripts/setup-drive.sh ~/Downloads/dt-drive-credentials.json
   ```

   El script:
   - Copia credenciales a `~/.config/` (chmod 600)
   - Abre el navegador para login Google (**solo lectura**)
   - Registra `google-drive-dt` en `~/.cursor/mcp.json`

4. **Reiniciar Cursor** — Settings → MCP → `google-drive-dt` en verde.
5. **Selector** — en el chat: `/drive`. El DT lista carpetas; elegís por número; describís el propósito de cada una.

### Verificar en Cursor

Settings → MCP → servidor **`google-drive-dt`** activo (indicador verde).

---

## Opción B — Antigravity

El command **`/drive`** y el skill **`dt-drive`** ya están en el repo (`.agents/workflows/drive.md`, `.agents/skills/dt-drive/`). El OAuth es el mismo; solo cambia dónde se registra el MCP.

### Tarjeta rápida

```text
1. Descargá dt-drive-credentials.json (canal interno)
2. /yo
3. ./scripts/setup-drive.sh ruta/al/dt-drive-credentials.json --ide antigravity
   (o --ide all si también usás Cursor)
4. Reiniciá Antigravity
5. /drive → elegí carpetas
```

### Detalle paso a paso

1. **Credenciales + OAuth** — mismo script que Cursor:

   ```bash
   ./scripts/setup-drive.sh ~/Downloads/dt-drive-credentials.json --ide antigravity
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

4. **Reiniciar Antigravity** tras guardar la config.

5. **Selector** — `/drive` en el chat → elegir carpetas.

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
./scripts/setup-drive.sh ~/Downloads/dt-drive-credentials.json --ide all
```

OAuth y credenciales son **una sola vez**; el script registra el MCP en ambos IDEs. Reiniciá **ambos** clientes.

---

## Qué hace el selector de carpetas (`/drive`)

1. Lista **Unidades compartidas** y carpetas **raíz** de "Mi unidad".
2. Vos elegís por número (ej. `1, 3, 5`) — no hace falta compartir todo el Drive.
3. Por cada carpeta: una frase de qué contiene + keywords opcionales.
4. Guarda `vitals/config/drive-context.yaml` (**no va a GitHub**).

Modo **`full_drive`**: solo si lo pedís explícitamente ("todo mi Drive").

## Uso diario (después del setup)

Ejemplos de prompts:

- *"Buscá en mis briefs de clientes el documento de Acme"*
- *"Resumí el reporte de marzo en la carpeta Reportes"*
- *"¿Qué propuestas tenemos pendientes según Drive?"*

El DT consulta **solo** las carpetas registradas (regla `18-drive-contexto`).

## Qué NO se comparte

| Dato | ¿Va al repo público? |
|------|----------------------|
| Credenciales OAuth de la empresa | **No** |
| Tu token de Google | **No** |
| Carpetas que elegiste | **No** |
| Contenido de archivos | **No** — lectura bajo demanda |

## Cambiar carpetas / desvincular

| Acción | Cómo |
|--------|------|
| Agregar o quitar carpetas | `/drive` de nuevo |
| Desvincular cuenta | Borrar `tokens.json` y opcionalmente `drive-context.yaml` |
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
