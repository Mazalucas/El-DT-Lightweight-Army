---
name: github-save-release
description: "[Framework] Release del template DT (solo mode canonical) — bump VERSION, commit atribuido, tag y push. No usar para versión de producto; eso es /guardar."
---

# github-save-release

Complementa `/github-save-small`. **Mismas exclusiones** que `git-guardar`.

**Alcance:** repo **`mode: canonical`** en `vitals/config/dt-upstream.md`. En proyectos **`consumer`**, la versión de la app la maneja **`/guardar`** ([`vitals/specs/project-version.md`](../../../vitals/specs/project-version.md)) — no bump `VERSION` aquí salvo que mantengas el template DT como producto.

## Pre-requisitos

1. `vitals/ops/session.yaml` con `operator.id` — si falta, pedir `/yo`.
2. Confirmar repo y rama con el usuario.
3. Sugerir `/actualizar` si la rama está behind.

## Exclusiones (nunca stage)

Igual que `git-guardar`: `vitals/ops/session.yaml`, `.env`, `*.credentials`, `vitals/workspace.yaml`, `draft-*` en inbox.

## Pasos

1. **Versión:** bump **patch** en `VERSION` (raíz del template). Si el proyecto consumidor tiene versiones en app (package.json, etc.), bump allí también según convención del repo.
2. `git status` — resumen al usuario.
3. Stage todo lo relevante **excepto** exclusiones; reset si `session.yaml` quedó staged.
4. Commit:

   ```text
   release({operator_id}): template v{X.Y.Z}

   Operador: {name} ({role})
   Estado: local-only | pre-deploy | deployed (según corresponda)
   ```

5. Tag anotado: `v{X.Y.Z}` (semver de `VERSION`).
6. `git push origin HEAD` y `git push origin v{X.Y.Z}` — sin `--force` en main/master.

## Entrega

Versión, hash, tag, estado del push.
