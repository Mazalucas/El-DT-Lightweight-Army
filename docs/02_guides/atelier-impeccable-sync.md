---
id: DOC-GUIDE-008
title: Actualizar Impeccable en Atelier (maintainers)
type: guide
status: canonical
owner: dt-platform
created: 2026-06-25
updated: 2026-06-25
tags:
  - atelier
  - impeccable
  - guide
  - vendor
summary: Ritual para sincronizar releases Impeccable en tools/atelier sin perder overlays DT.
related:
  - DOC-DEC-004
  - DOC-GUIDE-005
  - DOC-REF-008
priority: high
source_of_truth: true
---

# Actualizar Impeccable en Atelier

## Cuándo

- Release Impeccable (`skill-v*` / CLI npm)
- `/atelier actualizar` solicitado por maintainer
- `UPDATE_AVAILABLE` en context adapter

## Ritual

```bash
# 1. Working tree limpio
git status

# 2. Dry-run
./tools/atelier/scripts/sync-from-impeccable.sh --dry-run --latest

# 3. Apply
./tools/atelier/scripts/sync-from-impeccable.sh --latest
# o pin explícito:
./tools/atelier/scripts/sync-from-impeccable.sh --tag skill-v3.8.0 --cli 3.1.0

# 4. Verificar
./scripts/sync-ide.sh
./scripts/dt-doctor.sh

# 5. Commit
/guardar
```

## Qué editar manualmente (si hace falta)

Solo `tools/atelier/overlays/` — nunca `generated/`.

## Troubleshooting

| Problema | Acción |
|----------|--------|
| `detector engine not found` | `cd tools/atelier && npm install` |
| reference count < 23 | Re-run sync; verificar submodule tag |
| Hook conflict | Revisar `.cursor/hooks.json` merge backup |

## Licencia

Impeccable Apache 2.0 — ver `tools/atelier/ATTRIBUTION.md`.
