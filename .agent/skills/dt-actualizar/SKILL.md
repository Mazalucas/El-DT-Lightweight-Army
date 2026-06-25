---
name: dt-actualizar
description: "[Framework] Incorporar nueva versión del framework DT desde dt-upstream (dry-run, confirmación, apply). Use when the user invokes /actualizar-dt."
---

# dt-actualizar

Aplica actualizaciones del **framework DT** en un repo **consumidor**. Gate duro: [`vitals/specs/precedence.md`](../../../vitals/specs/precedence.md).

**Toda la lógica está en Markdown** — la IA ejecuta Git según las referencias; no hay scripts Ruby de sync.

## Referencias (obligatorias)

| Archivo | Contenido |
|---------|-----------|
| [`references/sync-from-upstream.md`](references/sync-from-upstream.md) | Dry-run, apply, post-sync |
| [`references/sync-paths.md`](references/sync-paths.md) | Paths incluidos / excluidos |
| [`vitals/specs/dt-upstream-config.md`](../../../vitals/specs/dt-upstream-config.md) | Config `dt-upstream.md` |

## Pre-requisitos

1. **`/yo`** recomendado.
2. `vitals/config/dt-upstream.md` con `mode: consumer` + remote `dt-upstream`.
3. Working tree limpio — si no → **`/guardar`** o stash.

## Pasos

1. Leer [`sync-from-upstream.md`](references/sync-from-upstream.md) y [`sync-paths.md`](references/sync-paths.md).
2. Dry-run con `git fetch` + `git diff --name-only` (listar archivos).
3. Confirmación explícita del usuario.
4. Apply con `git checkout dt-upstream/vX.Y.Z -- <paths>`.
5. Actualizar `framework_version` en `vitals/config/dt-upstream.md`.
6. Post-sync: [`post-sync-pipeline.md`](../dt-setup/references/post-sync-pipeline.md) si Ruby hay; `./scripts/dt-doctor.sh`.
7. Entrega + **`/guardar`**.

## Qué reutilicé

- Referencias `.md` anteriores, `post-sync-pipeline.md`, `dt-doctor.sh` (solo verificación).

## Qué creé y por qué

- N/A — orquestación Markdown-first sobre Git.
