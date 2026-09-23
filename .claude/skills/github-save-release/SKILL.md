---
name: github-save-release
description: "[Framework] Alias de /guardar en repo canónico — bump, sync, commit vX.Y.Z, tag. Preferir /guardar directamente."
---

# github-save-release

Complementa `/github-save-small`. Mismas exclusiones que `git-guardar`.

En repo **`mode: canonical`**, ejecutar el flujo de **`git-guardar`** (la IA elige el bump, sync y tag). Este skill existe por compatibilidad con el command `/github-save-small`.

Antes del bump, el gate `./scripts/dt-publish-gate.sh` tiene que salir **0**. Si sale **10**, este no es el remoto oficial: usá `/guardar` en el repo del proyecto. Si sale **30** o **40**, detené. No pidas acceso al DT.
