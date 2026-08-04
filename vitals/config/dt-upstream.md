---
version: 1
mode: canonical
framework_version: 1.7.11
source:
  remote: dt-upstream
  ref: main
preserve_paths: []
---

# Upstream El DT — plantilla canónica

- **`mode: canonical`** — este repo **es** el framework DT; publicás con `/github-save-small`.
- **`framework_version`** — semver del framework (debe coincidir con `VERSION` en la raíz).
- **`preserve_paths`** — vacío en plantilla; los consumidores añaden rutas de producto propias.
- Fase B de `/actualizar` se **omite** (no self-check contra upstream).

Remote Git (opcional): `git remote add dt-upstream <url-del-repo-espejo>`.
