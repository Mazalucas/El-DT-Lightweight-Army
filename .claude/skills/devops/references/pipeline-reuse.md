# Pipeline reuse (CI/CD)

## Antes de un workflow nuevo

- [ ] Listar workflows en `.github/workflows/`
- [ ] ¿Job existente hace 80% del trabajo?
- [ ] ¿Hay composite action o reusable workflow?

## Patrones

| Situación | Acción |
|-----------|--------|
| Mismo build, distinto entorno | Matrix `environment: [staging, prod]` |
| Mismo deploy, distinto target | Matrix `firebase-target` o inputs |
| Step repetido 2+ veces | Composite action en `.github/actions/` |
| Monorepo | Reutilizar job `setup-node` con cache key compartida |

## DRY en YAML

- `env:` a nivel workflow para versiones Node, Firebase CLI
- Anchors no portables — preferir reusable workflow en GitHub

## Secrets

- Nunca valores en YAML
- Reutilizar secret names ya documentados en runbook
- Firebase: `FIREBASE_TOKEN` o OIDC según setup existente

## Scripts npm

Preferir un script en `package.json` invocado desde CI:

```json
"deploy:prod": "vite build && firebase deploy --only hosting,functions"
```

No duplicar comandos largos en YAML y en README por separado.
