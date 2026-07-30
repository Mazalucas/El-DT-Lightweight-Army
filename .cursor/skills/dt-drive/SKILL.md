---
name: dt-drive
description: "[Rutina] Conectar Google Drive al cerebro del DT — OAuth, selector de carpetas, contexto de lectura. Use when the user invokes /drive or wants to sync Drive folders as organizational context."
---

# dt-drive

Integración **opcional** de Google Drive vía MCP (`@ibarcarty/mcp-server-google-drive`). Sin credenciales en el repo; tokens y registro de carpetas solo en la máquina local.

**Guías:** `docs/02_guides/drive-cerebro-setup.md` (`DOC-GUIDE-009`) · admin Cloud: `docs/06_operations/drive-google-cloud-admin.md` (`DOC-OPS-002`).

## Prerequisitos

| Requisito | Verificación |
|-----------|--------------|
| Sesión local | `vitals/ops/session.yaml` con `operator.id` — si falta → **`/yo`** primero |
| Node.js 18+ | `node -v` |
| Credenciales OAuth de la empresa | Archivo JSON distribuido por canal interno (nunca en Git) |
| MCP Google Drive | Entrada en el IDE: Cursor `~/.cursor/mcp.json` · Antigravity `~/.gemini/config/mcp_config.json` (`setup-drive.sh --ide …`) |

## Archivos

| Archivo | Git | Rol |
|---------|-----|-----|
| `~/.config/mcp-server-google-drive/oauth-credentials.json` | No | Client ID/secret de la app interna |
| `~/.config/mcp-server-google-drive/tokens.json` | No | Token OAuth del usuario |
| `vitals/config/drive-context.yaml` | No | Carpetas elegidas + propósito |
| `vitals/config/drive-context.yaml.example` | Sí | Plantilla de schema |

## Flujo `/drive` — conexión inicial

1. Confirmar sesión (`/yo` si falta).
2. Preguntar si ya tiene `dt-drive-credentials.json` del canal interno de la empresa.
3. Ejecutar `./scripts/setup-drive.sh [ruta/credenciales.json] [--ide cursor|antigravity|all]`:
   - Valida Node 18+
   - Copia credenciales a `~/.config/mcp-server-google-drive/oauth-credentials.json` (chmod 600)
   - Fija `GDRIVE_MCP_SCOPES=https://www.googleapis.com/auth/drive.readonly`
   - Corre `npx @ibarcarty/mcp-server-google-drive auth` si no hay token (abre navegador)
   - Registra MCP: Cursor → `~/.cursor/mcp.json` · Antigravity → `~/.gemini/config/mcp_config.json` (y legacy si aplica)
4. Preguntar qué IDE usa. **Antigravity:** verificar Manage MCP Servers → raw config. **Cursor:** Settings → MCP.
5. Pedir **reiniciar el IDE** si las tools no aparecen.
6. Continuar con **selector de carpetas** (abajo).

Si el usuario ya está autenticado y solo quiere cambiar carpetas → ir directo al selector.

## Flujo `/drive` — selector de carpetas

Objetivo: el usuario elige **qué carpetas** comparte al cerebro (no todo el Drive salvo que lo pida explícitamente).

1. Leer `vitals/config/drive-context.yaml` si existe (mostrar resumen actual).
2. Via MCP `drive_list_files`:
   - Listar **Shared Drives** accesibles (`corpora: drive`, `includeItemsFromAllDrives: true`, `supportsAllDrives: true`, `q: mimeType='application/vnd.google-apps.folder'`).
   - Listar carpetas de **primer nivel** en "Mi unidad" (`q: 'root' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`).
3. Presentar lista **numerada** agrupada:
   - **Unidades compartidas** (nombre + id)
   - **Mi unidad — carpetas raíz** (nombre + id)
   - Opción final: **"Todo mi Drive"** (`sync_mode: full_drive`) — solo si el usuario lo pide explícitamente; advertir que las consultas serán más amplias.
4. El usuario elige por número (ej. `1, 3, 5`) o nombres.
5. Por **cada carpeta elegida**, preguntar: *"¿Qué vive acá? (1 frase)"* y opcionalmente keywords (ej. brief, cliente, reporte).
6. Escribir `vitals/config/drive-context.yaml`:

```yaml
version: 1
updated: "<ISO8601>"
operator_id: "<desde session.yaml>"
sync_mode: selective  # o full_drive si eligió todo
folders:
  - id: "<folderId>"
    name: "<nombre visible>"
    drive: "<my_drive|shared:<driveName>>"
    purpose: "<qué contiene>"
    keywords:
      - "<tag>"
registered_at: "<ISO8601>"
```

7. Confirmar resumen: carpetas registradas, modo, operador. Recordar que el archivo **no va a Git**.

## Flujo `/drive` — reconfigurar o desvincular

- **Agregar carpetas:** repetir selector; merge sin duplicar `id`.
- **Quitar carpetas:** editar `drive-context.yaml` con confirmación del usuario.
- **Desvincular cuenta:** borrar `tokens.json` local; opcionalmente vaciar `drive-context.yaml`. No tocar credenciales OAuth de la empresa (son compartidas).

## Protocolo de uso diario (DT)

Cuando `vitals/config/drive-context.yaml` existe y el MCP está activo:

1. **Consulta dirigida** — priorizar carpetas registradas usando queries con `'<folderId>' in parents` o búsqueda acotada por nombre/purpose/keywords del registro.
2. **No ingesta masiva** — leer solo archivos relevantes a la pregunta; no volcar carpetas enteras al chat.
3. **Solo lectura** — scope `drive.readonly`; no crear/editar/borrar en Drive (fase 2).
4. **Charter no-secrets** — no copiar al repo tokens, credenciales ni contenido sensible de Drive sin confirmación; ver `vitals/charter/no-secrets.md`.
5. **Drive = contexto, no memoria** — destilar a `vitals/` o `docs/` solo si el usuario pide persistir algo en el cerebro compartido.
6. **Límite honesto** — el token OAuth técnicamente ve todo lo que la cuenta ve; el registro de carpetas es la política del DT, no un sandbox de Google.

## Tools MCP útiles

| Tool | Uso |
|------|-----|
| `drive_list_files` | Listar carpetas/archivos con filtros |
| `drive_search` | Búsqueda por nombre o contenido (acotar a carpetas registradas) |
| `drive_read_file` | Leer Docs (→ Markdown), Sheets (→ CSV), PDFs de texto |

## Errores frecuentes

| Síntoma | Acción |
|---------|--------|
| MCP sin tools | Reiniciar IDE; Cursor: `~/.cursor/mcp.json` · Antigravity: Manage MCP Servers → raw config |
| `access_denied` en OAuth | App interna no aprobada por IT; ver `DOC-OPS-002` |
| Token expirado | Re-correr `./scripts/setup-drive.sh` o `npx @ibarcarty/mcp-server-google-drive auth` |
| Carpeta no aparece | Permisos de Drive de esa cuenta; probar otra carpeta |

## No hacer

- No commitear `drive-context.yaml`, credenciales ni tokens.
- No hardcodear client ID/secret en el repo.
- No asumir que todos tienen Drive conectado — es opt-in.
- No escribir en Drive en esta fase.
