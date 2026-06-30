# Firebase deploy — reutilizar config

## Archivos canónicos

- `firebase.json` — targets hosting, functions, predeploy hooks
- `.firebaserc` — aliases de proyecto
- `firestore.rules`, `firestore.indexes.json`
- `storage.rules`

## Extender vs duplicar

| Pedido | Acción |
|--------|--------|
| Deploy hosting + functions | `--only` existente; no segundo workflow idéntico |
| Nuevo site preview | Target en `firebase.json`, no proyecto Firebase duplicado sin razón |
| Predeploy lint/test | Hook en `firebase.json` reutilizado por todos los deploys |

## CI pattern (DT default)

```yaml
# Pseudocódigo — adaptar al workflow existente
- run: npm ci && npm run build
- run: firebase deploy --only hosting,functions --project $PROJECT_ID
```

Reutilizar job de test del repo antes de deploy si ya existe.

## Coordinación

- **arquitecto** define qué se despliega (functions nuevas)
- **devops** extiende pipeline — no inventar entrypoints backend
