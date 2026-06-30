# IaC modules

## Terraform / Pulumi / CDK

- Buscar `modules/` compartidos antes de recurso inline duplicado
- Variables con defaults sensatos — no copiar bloques `resource` idénticos
- Outputs reutilizables para otros stacks

## Docker

- Extender `Dockerfile` base del repo (multi-stage existente)
- No `Dockerfile.prod2` — args `BUILD_ENV=production`

## Cloud Run / containers (escalation DT)

- Misma imagen base que otros servicios del repo
- Reutilizar service account y secret refs documentados

## Anti-pattern

Pipeline que provisiona infra **ya gestionada** por Firebase Hosting/Functions sin opt-out documentado.
