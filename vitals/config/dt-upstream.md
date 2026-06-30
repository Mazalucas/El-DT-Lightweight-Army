---
version: 1
mode: consumer
framework_version: "1.7.2"
source:
  remote: dt-upstream
  ref: main
preserve_paths:
  - vitals/config/commands-meta.yaml
  - vitals/config/roster.yaml
  - vitals/config/roles.yaml
  - BRAIN.md
  - vitals/catalog/
  - knowledge/
  - README.md
  - modules/
  - docs/02_guides/cerebro-app-deploy.md
  - docs/02_guides/cerebro-app-local-test.md
  - docs/02_guides/cerebro-app-org-graph.md
  - docs/02_guides/cerebro-meet-apps-script.md
  - docs/02_guides/cerebro-profesional-setup.md
  - docs/02_guides/recordatorios-quickstart.md
---

# Upstream El DT — Cerebro Prime (consumidor)

- **`mode: consumer`** — proyecto propio; recibe avisos de release en `/actualizar`.
- **`framework_version`** — semver DT incorporado (actualizar tras `/actualizar-dt`).
- **`preserve_paths`** — rutas de Cerebro / Lucas Prime que no debe pisar el sync.

Remote Git: `git remote get-url dt-upstream`
