# Versión en `/guardar`

Spec: [`vitals/specs/project-version.md`](../../../../vitals/specs/project-version.md).

## Obligatorio (canonical y consumer)

1. Commit empieza con **`vX.Y.Z:`**
2. **`./scripts/project-sync-version.sh`** — README, dt-upstream, front/back
3. **`./scripts/dt-tag-version.sh --push`** tras push OK

## Bump

Solo **`/guardar release`** (o `/github-save-small` en canónico).
