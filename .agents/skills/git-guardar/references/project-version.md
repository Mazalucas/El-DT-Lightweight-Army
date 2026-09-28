# Versión en `/guardar`

Spec: [`vitals/specs/project-version.md`](../../../../vitals/specs/project-version.md).

## Regla central

**Hay cambios → resolver VERSION del producto → la IA elige patch, minor o major → sync → entrada en `CHANGELOG.md` → commit `vX.Y.Z:` → tag → GitHub Release.**

`VERSION` es el producto. `framework_version` es el DT. Nunca se copian entre sí.

Si el mensaje nombra el dígito, usa ese. Sin cambios → no bump.

## Scripts

```bash
./scripts/project-resolve-version.sh
./scripts/project-bump-version.sh patch   # o minor, o major
./scripts/project-sync-version.sh
./scripts/dt-tag-version.sh --push --message "Release v$(cat VERSION)"
./scripts/dt-publish-github-release.sh
```
