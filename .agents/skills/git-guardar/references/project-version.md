# Versión del proyecto en `/guardar`

Spec: [`vitals/specs/project-version.md`](../../../../vitals/specs/project-version.md).

## Defaults

| Acción | Bump | Tag |
|--------|------|-----|
| `/guardar` | No | Solo si cambió `VERSION` |
| `/guardar release` | patch | Sí |
| Primer `/guardar` | No | Tag inicial `v0.1.0` |
| `/bootstrap` | Prepara manifest + sync | — |

`auto_bump` default: **`none`**

## Scripts

```bash
./scripts/project-sync-version.sh
./scripts/dt-tag-version.sh --push --message "Release v$(cat VERSION)"
```
