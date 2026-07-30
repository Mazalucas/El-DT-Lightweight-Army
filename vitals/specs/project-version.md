# Especificación — versión del proyecto (`/guardar`)

Contrato: **guardar cambios = bump semver + sync + tag**.

## Fuente de verdad

**`VERSION`** (raíz) — el script de sync propaga a README, YAML y `package.json`.

## Reglas de `/guardar`

1. **Sin cambios** → no bump, no commit.
2. **Con cambios** → bump **patch** (default), salvo primer guardar consumer o `release minor`.
3. **Sync** → `./scripts/project-sync-version.sh` tras el bump.
4. **Commit** → empieza con `v{X.Y.Z}:` (versión ya incrementada).
5. **Tag** → `./scripts/dt-tag-version.sh --push` tras push OK.

## Bump

| Evento | Script |
|--------|--------|
| Patch (default en `/guardar`) | `./scripts/project-bump-version.sh patch` |
| Minor | `./scripts/project-bump-version.sh minor` |
| Reset consumer (primer guardar) | escribir `initial_semver` en `VERSION` |

Manifest: `auto_bump: patch` en canónico; consumer puede usar `none` solo si el equipo lo configura a mano.

## Sync (`project-sync-version.sh`)

| Tipo | Archivo |
|------|---------|
| `readme_badge` | `README.md` → `**vX.Y.Z**` |
| `yaml_frontmatter` | `dt-upstream.md` → `framework_version` (= VERSION en canónico) |
| `json` | front/back/apps `package.json` |

Discover: `frontend/`, `backend/`, `apps/*/package.json`.

## Scripts

- [`scripts/project-bump-version.sh`](../../scripts/project-bump-version.sh)
- [`scripts/project-sync-version.sh`](../../scripts/project-sync-version.sh)
- [`scripts/dt-tag-version.sh`](../../scripts/dt-tag-version.sh)

## Skills

- [`git-guardar`](../../.cursor/skills/git-guardar/SKILL.md)
- [`dt-bootstrap`](../../.cursor/skills/dt-bootstrap/SKILL.md)
