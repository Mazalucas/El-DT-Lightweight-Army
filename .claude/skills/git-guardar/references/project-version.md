# Versión en `/guardar`

Spec: [`vitals/specs/project-version.md`](../../../../vitals/specs/project-version.md).

## Regla central

**Hay cambios → bump patch → sync → commit `vX.Y.Z:` → tag.**

Sin cambios → no bump.

## Scripts

```bash
./scripts/project-bump-version.sh patch   # o minor
./scripts/project-sync-version.sh
./scripts/dt-tag-version.sh --push --message "Release v$(cat VERSION)"
```
