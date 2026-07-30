# Especificación — versión del proyecto (`/guardar`)

Contrato para **semver unificado** en commit, tag, README y paquetes.

## Fuente de verdad

**`VERSION`** (raíz del repo) — todos los demás paths se alinean vía `./scripts/project-sync-version.sh`.

| Modo (`dt-upstream.md`) | Qué es `VERSION` |
|---------------------------|------------------|
| `canonical` | Versión publicada del framework DT |
| `consumer` | Versión del producto/app (independiente de `framework_version`) |

## Sincronización (`project-sync-version.sh`)

Manifest: [`vitals/config/project-version.yaml`](../config/project-version.yaml) (canónico) o example (consumer/bootstrap).

| Tipo | Archivo | Efecto |
|------|---------|--------|
| `readme_badge` | `README.md` | Línea `**vX.Y.Z**` |
| `yaml_frontmatter` | `vitals/config/dt-upstream.md` | Campo `framework_version` (canónico: = VERSION) |
| `json` | `package.json`, `frontend/`, `backend/`, `apps/*` | Campo `version` |

**Discover automático:** `frontend/package.json`, `backend/package.json`, `apps/*/package.json` si existen y no están en manifest.

## Reglas de `/guardar` (ambos modos)

1. **Commit** — primera línea empieza con `v{X.Y.Z}:`.
2. **Sync** — ejecutar script antes de stage/commit.
3. **Bump** — solo `/guardar release` (patch/minor).
4. **Tag** — tras push: `dt-tag-version.sh --push`. Si `VERSION` no cambió y el tag ya apunta a un commit anterior → omitir; nueva tag con **`/guardar release`**.

## Consumer

- Bootstrap o primer guardar: reset a `initial_semver` (`0.1.0`).
- `framework_version` queda en `dt-upstream.md`; no se bump en guardar habitual.

## Canonical (repo El DT)

- Manifest versionado con README + `framework_version` + tools.
- Cada guardar sincroniza; tag nueva solo cuando bump (`/guardar release`).
- `/github-save-small` = release documentado del template (mismo bump+tag).

## Scripts

- [`scripts/project-sync-version.sh`](../../scripts/project-sync-version.sh)
- [`scripts/dt-tag-version.sh`](../../scripts/dt-tag-version.sh)

## Skills

- [`git-guardar`](../../.cursor/skills/git-guardar/SKILL.md)
- [`dt-bootstrap`](../../.cursor/skills/dt-bootstrap/SKILL.md)
- [`github-save-release`](../../.cursor/skills/github-save-release/SKILL.md)
