# Bootstrap `/deploy` — checklist IA

Usar en la **primera** ejecución cuando `deploy.yaml` no existe o `initialized: false`.

## Discover (grep / read)

- [ ] `docs/DEPLOY.md` o equivalente
- [ ] `firebase.json`, `.firebaserc`, `firestore.rules`, `storage.rules`
- [ ] `Dockerfile`, `docker-compose*.yml`, `cloudbuild.yaml`, `app.yaml`
- [ ] `.github/workflows/` con `deploy`, `release`, `cd`
- [ ] `package.json` en raíz y subcarpetas (`frontend/`, `backend/`, `apps/*`)
- [ ] Scripts shell: `scripts/deploy*.sh`, `Makefile` targets `deploy`

## Preguntas al operador (si ambiguo)

- ¿Entorno objetivo ahora? (production / staging / preview)
- ¿Monorepo — qué paquetes se despliegan juntos?
- ¿Secrets ya configurados en el proveedor? (no pedir valores en chat)

## Salida esperada

1. `vitals/config/deploy.yaml` con `initialized: true`
2. `references/project-deploy.md` relleno desde template
3. Resumen de comandos exactos que se usarán en la próxima ejecución

## Anti-patrones

- Hardcodear URL de repo o project id sin leer `.firebaserc` / env del CI
- Segundo workflow idéntico al existente
- Deploy sin build previo cuando el repo ya tiene hook de build
