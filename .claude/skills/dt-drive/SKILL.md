---
name: dt-drive
description: "[Rutina] Conectar Google Drive al cerebro del DT — plugin oficial del IDE, selector de carpetas, solo lectura. Use when the user invokes /drive or wants to sync Drive folders as organizational context."
---

# dt-drive

Integración **opcional** de Google Drive vía el **MCP oficial del IDE**. El servidor propio `google-drive-dt` está descontinuado.

**Spec (embudo + install por IDE):** `vitals/specs/google-apps-mcp.md`. **Guías:** `docs/02_guides/drive-cerebro-setup.md` (`DOC-GUIDE-009`) · admin: `docs/06_operations/drive-google-cloud-admin.md` (`DOC-OPS-002`). **ADR:** `DOC-DEC-006`.

## Prerequisitos

| Requisito | Verificación |
|-----------|--------------|
| Sesión local | `vitals/ops/session.yaml` con `operator.id` — si falta → **`/yo`** |
| MCP oficial Drive | Cursor: plugin `google-drive`. Antigravity/Claude: `drivemcp.googleapis.com` |
| Cuenta Google | La que el operador autoriza en el plugin / conector |

Ya no hace falta Node, ni `dt-drive-credentials.json`, ni `npx @ibarcarty/…`.

## Archivos

| Archivo | Git | Rol |
|---------|-----|-----|
| `vitals/config/google-apps.yaml` | No | Qué apps habilitó |
| `vitals/config/drive-context.yaml` | No | Carpetas + propósito |
| `vitals/config/drive-context.yaml.example` | Sí | Plantilla |

## Flujo `/drive` — conexión inicial

1. Confirmar sesión (`/yo` si falta).
2. **Embudo** (no saltear): *¿solo Drive o también Gmail y Calendar?* Spec.
3. Detectar el IDE de esta conversación.
4. **Instalar el oficial de Drive:**
   - **Cursor:** tool `install_plugin` con `pluginName: google-drive`. Si ya está y `needsAuth` → el operador autentica. No digas que quedó instalado si cancela.
   - **Antigravity / Claude:** spec § Instalar por IDE (URL remota + OAuth). No inventes Client IDs. Si IT no habilitó el MCP remoto, decí el límite.
5. Esperar tools reales (`search_files` / `drive_search` / equivalentes). Si no hay, parar.
6. Escribir/actualizar `google-apps.yaml` (`drive: true`). **Selector de carpetas** (abajo). Si eligió las tres, ofrecer `/gmail` y `/calendar`.
7. Si existe el servidor legado `google-drive-dt` en `mcp.json`, ofrecer `./scripts/setup-drive.sh --remove-legacy` **después** de que el oficial responda.

Si ya está autenticado y solo quiere cambiar carpetas → selector.

## Flujo `/drive` — selector de carpetas

Objetivo: el usuario elige **qué carpetas** comparte al cerebro (no todo el Drive salvo que lo pida).

1. Leer `vitals/config/drive-context.yaml` si existe.
2. Con las tools oficiales, listar unidades compartidas y carpetas raíz de Mi unidad (nombres + ids).
3. Lista **numerada**. Opción final: **"Todo mi Drive"** (`sync_mode: full_drive`) solo si lo pide; advertir.
4. Elige por número o nombre.
5. Por cada carpeta: *"¿Qué vive acá? (1 frase)"* + keywords opcionales.
6. Escribir `drive-context.yaml` (schema del `.example`). No va a Git.
7. Confirmar resumen.

## Reconfigurar o desvincular

- **Agregar/quitar carpetas:** selector de nuevo; merge sin duplicar `id`.
- **Desvincular:** el operador cierra sesión en el plugin / conector del IDE. Vaciar `drive-context.yaml` y el flag en `google-apps.yaml` si lo pide. No borrar configs de otros MCP.

## Uso diario

Cuando `drive-context.yaml` existe y el MCP está activo:

1. Priorizar carpetas registradas.
2. No volcar carpetas enteras al chat.
3. **Solo lectura** — aunque el oficial tenga create/share. No crear/editar/borrar/compartir.
4. Charter no-secrets (`vitals/charter/no-secrets.md`).
5. Drive = contexto, no memoria del repo.
6. El token ve todo lo que la cuenta ve; el YAML es política DT.

## Tools

Usar las que existan (spec § Tools). Típico: `search_files` / `drive_search`, `read_file_content` / `drive_read_file`, `get_file_metadata` / `drive_get_file_info`.

## Errores frecuentes

| Síntoma | Acción |
|---------|--------|
| Plugin cancelado | No seguir al selector. Ofrecer `/add-plugin google-drive` |
| `needsAuth` | El operador autentica el plugin; no fingir listados |
| Antigravity sin tools | Preview + GCP — `DOC-OPS-002`. No caer a `google-drive-dt` |
| Quedan dos Drive | Oficial OK → `--remove-legacy` |

## No hacer

- No commitear contextos ni cuentas/proyectos GCP.
- No reinstalar `@ibarcarty/mcp-server-google-drive`.
- No escribir en Drive.
- No saltear el embudo una app vs las tres.
- No asumir que todos tienen Drive — opt-in.
