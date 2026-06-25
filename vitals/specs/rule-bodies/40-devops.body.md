# DevOps e infraestructura

Stack default del DT: ver regla `08-stack-web-default` · deploy Firebase. Reuse-first: `15-engineering-reuse` · `DOC-REF-006` · skill `devops`.

## Principios

- **IaC declarativo** — workflows, `firebase.json`, Terraform/Pulumi versionados
- **DRY en pipelines** — extender jobs/workflows existentes; matrices y reusable workflows antes de duplicar YAML
- **Secrets nunca en YAML** — Firebase Secrets, GitHub Secrets, secret managers del cloud
- **Un script canónico** — preferir `package.json` scripts invocados desde CI

## Convenciones CI/CD

- Reutilizar cache de dependencias (Node, etc.) ya configurada en el repo
- Stages: lint → test → build → deploy (omitir solo si el repo no tiene toolchain)
- Security checks en pipeline cuando existan (audit, SAST) — no inventar pipeline paralelo

## Deploy (Firebase default)

- Reutilizar `firebase.json` targets y `--only` existentes
- Predeploy hooks compartidos para lint/test/build
- Coordinar con **arquitecto** qué recursos se despliegan

## Estrategias de deploy

Elegir según contexto del repo (documentar en entrega):

- **Rolling** — default razonable para Hosting/Functions
- **Blue/green o canary** — solo si el repo ya tiene patrón o hay requisito explícito

## Rollback

- Enlazar runbooks en `docs/06_operations/` si existen
- No documentar rollback ad hoc sin revisar procedimiento existente (skill `devops/references/rollback-runbook.md`)

## Referencias

- Skill táctica: `.cursor/skills/devops/SKILL.md`
- Stack web: `docs/03_reference/web-stack-default.md` (`DOC-REF-005`)
