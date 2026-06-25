---
name: atelier-actualizar
description: "[Framework] Sync Impeccable upstream into tools/atelier (vendor update). Use when the user invokes /atelier actualizar or UPDATE_AVAILABLE from context adapter."
---

# atelier-actualizar

Incorpora nueva versión de **Impeccable** en el pack Atelier del DT.

## Pre-requisitos

1. **`/yo`** recomendado (mantenedor).
2. Working tree limpio — si no → **`/guardar`** o stash.
3. `tools/atelier/upstream/` submodule presente.

## Pasos

1. Dry-run:

```bash
./tools/atelier/scripts/sync-from-impeccable.sh --dry-run --latest
```

2. Mostrar al usuario: tag skill, CLI version, reference count.
3. Confirmación explícita.
4. Apply:

```bash
./tools/atelier/scripts/sync-from-impeccable.sh --latest
# o pin:
./tools/atelier/scripts/sync-from-impeccable.sh --tag skill-v3.8.0 --cli 3.1.0
```

5. `./scripts/sync-ide.sh`
6. `./scripts/dt-doctor.sh`
7. Entrega + sugerir **`/guardar`** con mensaje de bump Impeccable.

## Qué actualiza

- `tools/atelier/generated/` (references + scripts)
- `tools/atelier/impeccable-lock.yaml`
- `.cursor/skills/atelier/SKILL.md` (compuesto)
- `.cursor/hooks.json` (merge)
- `skills-lock.json` entrada `atelier-impeccable`

## Qué NO toca

- `tools/atelier/overlays/` (DT)
- `.cursor/skills/design/` (pack nativo)

## Gate duro

No force-push. No commit si `dt-doctor` falla en checks atelier.
