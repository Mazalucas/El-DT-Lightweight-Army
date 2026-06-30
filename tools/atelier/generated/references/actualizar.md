# DT-only: actualizar Impeccable vendor

Maintainer sync — updates upstream skill references, scripts, CLI pin.

## When

- User runs `/atelier actualizar`
- `UPDATE_AVAILABLE` from context adapter
- After Impeccable release (skill-v* / CLI)

## Steps

1. Confirm clean working tree or stash.
2. Dry-run: `./tools/atelier/scripts/sync-from-impeccable.sh --dry-run --latest`
3. Show diff summary (lock, reference count, package.json version).
4. On confirm: `./tools/atelier/scripts/sync-from-impeccable.sh --latest`
5. `./scripts/sync-ide.sh`
6. `./scripts/dt-doctor.sh`
7. Suggest `/guardar` with message noting Impeccable version bump.

## Skill

Full protocol: `.cursor/skills/atelier-actualizar/SKILL.md`
