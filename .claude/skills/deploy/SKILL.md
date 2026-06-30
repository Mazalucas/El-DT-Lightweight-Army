---
name: deploy
description: "[Módulos] Desplegar Cerebro App a Firebase (build + firebase deploy). Use when the user invokes /deploy or wants production deploy."
---

# deploy

Despliega **`cerebro-app`** en Firebase Hosting + Functions (`cerebro-prime-a0729`).

## Módulo

| Campo | Valor |
|-------|--------|
| ID catálogo | `cerebro-app` |
| Proyecto Firebase | `cerebro-prime-a0729` |
| URL producción | https://cerebro-prime-a0729.web.app |
| Script | `./scripts/deploy-cerebro-app.sh` |
| Guía | `docs/02_guides/cerebro-app-deploy.md` |

## Antes de desplegar (validar con el operador)

1. **Plan Blaze** — Functions y Secret Manager requieren billing activo.
2. **Config local (no Git):**
   - `modules/cerebro-app/.firebaserc`
   - `modules/cerebro-app/src/.env.production.local` (VITE_FIREBASE_*)
   - `modules/cerebro-app/functions/.env.cerebro-prime-a0729` (GOOGLE_OAUTH_CLIENT_ID, APP_URL)
3. **Secrets** (una vez por proyecto): `GOOGLE_OAUTH_CLIENT_SECRET`, `ENCRYPTION_KEY` vía `firebase functions:secrets:set`.
4. **Firebase CLI:** `firebase login` y proyecto activo correcto.
5. **No commitear** `client_secret*.json` ni `.env*` con valores reales.

Si falta config, **detener** y guiar con la guía — no inventar secrets.

## Alcance (preguntar si no está claro)

| Invocación | Comando |
|------------|---------|
| `/deploy` (default) | `./scripts/deploy-cerebro-app.sh` |
| Solo frontend | `./scripts/deploy-cerebro-app.sh --hosting` |
| Solo API/cron | `./scripts/deploy-cerebro-app.sh --functions` |
| Solo reglas | `./scripts/deploy-cerebro-app.sh --rules` |
| Solo build/validar | `./scripts/deploy-cerebro-app.sh --prepare-only` |
| Redeploy sin rebuild | `./scripts/deploy-cerebro-app.sh --skip-build` |
| Sin bump de versión | `./scripts/deploy-cerebro-app.sh --no-bump` |

## Pasos del agente

1. Confirmar alcance (completo vs `--hosting` / `--functions` / `--rules`).
2. Verificar prerequisitos anteriores; si algo falta, listar qué copiar/completar.
3. **Versión:** cada deploy ejecuta `scripts/bump-cerebro-app-version.sh` (+1 en `modules/cerebro-app/VERSION`, front sidebar y `/api/health`). Si un deploy falló **después** del bump, reintentar con `--no-bump`.
4. Ejecutar el script desde la **raíz del repo** (requiere red + Firebase auth local).
5. Reportar salida: versión nueva, build OK, target desplegado, errores de Firebase si los hay.
6. Post-deploy: URL, login Google, wizard Setup en Ajustes.

## Versión (front + back)

| Fuente | Path |
|--------|------|
| Contador | `modules/cerebro-app/VERSION` (entero, versionado en Git) |
| Front (sidebar `vN`) | `shared/app-version.ts` → import en `shell.ts` |
| Back (`/api/health`) | `functions/src/lib/app-version.ts` |

Ambos TS se regeneran en cada bump; no editar a mano.

## Errores frecuentes

| Error | Acción |
|-------|--------|
| `must be on the Blaze plan` | Activar Blaze en Firebase Console |
| Secret overlaps env var | Quitar secrets de `functions/.env*` — solo Secret Manager en prod |
| Storage deploy fail | Activar Storage en Console; luego `./scripts/deploy-cerebro-app.sh --rules --with-storage` |
| OAuth redirect mismatch | Verificar URI en Google Cloud Console (guía deploy) |

## Related

- `scripts/prepare-cerebro-deploy.sh` — validación + build producción
- `/start` — dev local (puerto 5190)
- `modules/cerebro-app/README.md`
