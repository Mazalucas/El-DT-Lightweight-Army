# Especificación — versión del proyecto (`/guardar`)

Contrato para separar **versión del producto** de **versión del framework DT**.

## Fuentes de verdad

| Concepto | Dónde vive | Quién la bump |
|----------|------------|---------------|
| Versión **proyecto/app** | `VERSION` (raíz) + paths en `vitals/config/project-version.yaml` | `/guardar release` (modo consumer) |
| Versión **framework DT** | `framework_version` en `vitals/config/dt-upstream.md` | `/actualizar-dt`, `/github-save-small` (modo canonical) |
| Versión **template DT** en repo canónico | `VERSION` raíz = semver publicado del DT | `/github-save-small` — **no** auto-bump en `/guardar` |

Leer `mode` en [`vitals/config/dt-upstream.md`](../config/dt-upstream.example.md): `canonical` | `consumer`.

## Archivo `vitals/config/project-version.yaml`

Plantilla: [`vitals/config/project-version.yaml.example`](../config/project-version.yaml.example).

| Campo | Uso |
|-------|-----|
| `version` | Schema (`1`) |
| `initialized` | `false` hasta el **primer** `/guardar` exitoso en modo consumer |
| `initial_semver` | Semver de arranque (default `0.1.0`) |
| `sync_paths` | Lista `{ path, field }` — p. ej. `package.json` → `version` |
| `auto_bump` | `patch` \| `minor` \| `none` — **default `none`** (bump solo con `/guardar release`) |
| `tag_releases` | Si `true`, tag anotado `vX.Y.Z` cuando cambia `VERSION` o primer guardar |

## Preparación en `/bootstrap`

Tras reset de `VERSION` a `initial_semver`:

1. Crear `vitals/config/project-version.yaml` desde example (`auto_bump: none`, `initialized: false`).
2. **Discover** `package.json` (raíz, `frontend/`, `backend/`, `apps/*/package.json`) → `sync_paths`.
3. `./scripts/project-sync-version.sh` — alinear front/back/monorepo **antes** del primer commit de producto.

El primer `/guardar` solo marca `initialized: true` y tag inicial; no reinventa el manifest.

## Adopción sin bootstrap

Si el repo es `consumer` pero no pasó por `/bootstrap`: el primer `/guardar` crea el manifest (misma discover + sync) como fallback.

## Primer `/guardar` (consumer)

1. Si falta `project-version.yaml` → copiar desde example + discover (fallback).
2. Si `initialized: false` → marcar `initialized: true` tras commit exitoso.
3. Commit con prefijo `v{X.Y.Z}` (versión actual, sin bump).
4. Tag `v{initial_semver}` si aún no existe en remoto y `tag_releases: true`.

**No** bump por cambios solo de normativa DT — eso es upstream/framework, no producto.

## `/guardar` habitual (consumer)

- **Sin bump** de `VERSION` (default `auto_bump: none`).
- Mensaje **empieza** con la versión actual:

  ```text
  v{X.Y.Z} ({operator_id}): {resumen corto}
  ```

- Sin tag salvo que `VERSION` haya cambiado en el commit.

## `/guardar release` (consumer)

Intención explícita de release semver:

| Invocación | Bump |
|------------|------|
| `/guardar release` o "release" | **patch** |
| `/guardar release minor` o "minor release" | **minor** |
| `/guardar release patch` | **patch** |

Flujo: bump en `VERSION` → `project-sync-version.sh` → commit con prefijo nueva versión → tag `vX.Y.Z` si `tag_releases`.

## Modo `canonical` (repo El DT)

- `/guardar` **no** auto-bump `VERSION`.
- Release del framework: `/github-save-small` (`github-save-release`).
- Mensaje: `dt({operator_id}): {resumen corto}`

## Scripts

- [`scripts/project-sync-version.sh`](../../scripts/project-sync-version.sh) — propaga `VERSION` raíz a `sync_paths`
- [`scripts/dt-tag-version.sh`](../../scripts/dt-tag-version.sh) — tag anotado `vX.Y.Z` desde `VERSION`

## Skills

- [`git-guardar`](../../.cursor/skills/git-guardar/SKILL.md)
- [`dt-bootstrap`](../../.cursor/skills/dt-bootstrap/SKILL.md)
- [`github-save-release`](../../.cursor/skills/github-save-release/SKILL.md) — solo framework canonical
