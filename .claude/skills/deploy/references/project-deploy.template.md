# Deploy — {{PROJECT_NAME}}

> Generado por `/deploy` (bootstrap). Editar aquí y en `vitals/config/deploy.yaml` — fuente operativa dual.

## Resumen

| Campo | Valor |
|-------|--------|
| Plataforma | {{PLATFORM}} |
| Entorno default | {{DEFAULT_ENV}} |
| Última revisión | {{DATE}} |

## Pre-requisitos

- CLI: {{CLI_TOOLS}}
- Auth: {{AUTH_COMMANDS}}
- Secrets (fuera del repo): {{SECRETS_LOCATION}}

## Orden de ejecución — {{DEFAULT_ENV}}

```bash
# pre_deploy
{{PRE_DEPLOY_COMMANDS}}

# deploy
{{DEPLOY_COMMANDS}}

# post_deploy / smoke
{{POST_DEPLOY_COMMANDS}}
```

## Entornos adicionales

{{OTHER_ENVIRONMENTS}}

## Rollback

{{ROLLBACK_STEPS}}

## Notas del proyecto

{{PROJECT_NOTES}}
