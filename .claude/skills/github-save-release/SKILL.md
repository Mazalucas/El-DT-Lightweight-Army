---
name: github-save-release
description: "[Framework] Release del template DT — bump VERSION, sync README/paquetes, commit vX.Y.Z, tag y push. Alias operativo de /guardar release en canónico."
---

# github-save-release

Complementa `/github-save-small`. **Mismas exclusiones** que `git-guardar`.

**Alcance:** repo **`mode: canonical`**. Equivalente a **`/guardar release`** con bump patch en `VERSION`.

## Pasos

1. Bump **patch** en `VERSION` (raíz).
2. `./scripts/project-sync-version.sh` — README, `framework_version`, front/back/tools.
3. Stage (exclusiones de `git-guardar`).
4. `./scripts/dt-doctor.sh`.
5. Commit:

   ```text
   v{X.Y.Z} ({operator_id}): release template DT

   Operador: {name} ({role})
   ```

6. Push + `./scripts/dt-tag-version.sh --push --message "El DT template v{X.Y.Z}"`.

En proyectos **consumer**, usar **`/guardar release`** — no este skill salvo que publiques el template como producto.
