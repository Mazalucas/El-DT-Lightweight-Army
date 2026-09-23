# Versión en `/guardar`

Spec: [`vitals/specs/project-version.md`](../../../../vitals/specs/project-version.md).

## Regla central

**Hay cambios → la IA elige patch, minor o major → sync → commit `vX.Y.Z:` → tag.**

Si el mensaje nombra el dígito, usa ese. Sin cambios → no bump.

## Scripts

```bash
./scripts/project-bump-version.sh patch   # o minor, o major
./scripts/project-sync-version.sh
./scripts/dt-tag-version.sh --push --message "Release v$(cat VERSION)"
```
