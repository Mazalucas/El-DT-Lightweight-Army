---
version: 1
mode: consumer
framework_version: "1.7.2"
source:
  remote: dt-upstream
  ref: main
preserve_paths: []
---

# Upstream El DT

Copiá este archivo a `vitals/config/dt-upstream.md` y ajustá.

- **`mode: consumer`** — proyecto propio que recibe avisos de release en `/actualizar`.
- **`mode: canonical`** — este repo es la plantilla (publicás con `/github-save-small`); Fase B se omite.
- **`framework_version`** — semver del framework DT que tenés incorporado.
- **`preserve_paths`** — rutas extra que `/actualizar-dt` no debe pisar (docs de producto, etc.).

Remote Git (no va en este archivo): `git remote add dt-upstream <url-del-repo-canónico>`.
