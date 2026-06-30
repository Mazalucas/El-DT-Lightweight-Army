---
id: DOC-GUIDE-011
title: "Cerebro App — deploy producción"
type: guide
status: active
owner: dt
updated: "2026-06-10"
tags: [cerebro, firebase, deploy, webapp]
summary: "Desplegar la webapp unificada Cerebro App en Firebase."
related: [DOC-GUIDE-010, DOC-GUIDE-013]
priority: high
source_of_truth: true
---

# Cerebro App — deploy producción

Proyecto Firebase: **`cerebro-prime-a0729`** · Web app: **`cerebro-prime-webapp`**

| Recurso | Valor |
|---------|--------|
| Hosting | https://cerebro-prime-a0729.web.app |
| Auth domain | cerebro-prime-a0729.firebaseapp.com |
| Functions region | `europe-west1` |
| OAuth callback | `https://cerebro-prime-a0729.web.app/api/auth/google/callback` |

## Plan Firebase: Blaze (obligatorio)

Cerebro App usa **Cloud Functions** (API + cron horario) y **Secret Manager** (`functions:secrets:set`).

El plan **Spark (gratis) no alcanza**. Hay que pasar a **Blaze (pay-as-you-go)**:

https://console.firebase.google.com/project/cerebro-prime-a0729/usage/details

- Sin Blaze verás: `must be on the Blaze plan` al crear secrets o desplegar Functions.
- Blaze factura por uso; con poco tráfico el coste suele ser bajo (Firestore/Functions tienen free tier mensual).
- Tarjeta requerida; podés poner [presupuesto y alertas](https://console.cloud.google.com/billing/budgets) en GCP.

## Checklist previo

1. Proyecto Firebase en **Blaze** con **Authentication** (Google), **Firestore**, **Storage**, **Functions**, **Hosting**
   - **Storage:** activar en [Firebase Console → Storage](https://console.firebase.google.com/project/cerebro-prime-a0729/storage) antes del deploy de reglas
2. Google Cloud Console — OAuth **Web client** (para Drive/Docs, distinto del login Firebase):
   - Authorized redirect URI: `https://cerebro-prime-a0729.web.app/api/auth/google/callback`
   - Authorized JavaScript origins: `https://cerebro-prime-a0729.web.app`
3. Habilitar **Google Drive API** y **Google Docs API**

## Config local (no Git)

```bash
# Proyecto Firebase CLI
cp modules/cerebro-app/.firebaserc.example modules/cerebro-app/.firebaserc

# Frontend — build producción (Vite embebe config en el bundle)
cp modules/cerebro-app/.env.production.local.example modules/cerebro-app/src/.env.production.local
# Completar VITE_FIREBASE_* desde Firebase Console → Project settings → cerebro-prime-webapp

# Functions — variables no secretas (se suben con deploy)
cp modules/cerebro-app/functions/.env.cerebro-prime-a0729.example \
   modules/cerebro-app/functions/.env.cerebro-prime-a0729
# Completar GOOGLE_OAUTH_CLIENT_ID
```

## Secrets (Cloud Functions)

```bash
cd modules/cerebro-app
firebase functions:secrets:set GOOGLE_OAUTH_CLIENT_SECRET
firebase functions:secrets:set ENCRYPTION_KEY
```

**No** pongas `ENCRYPTION_KEY` ni `GOOGLE_OAUTH_CLIENT_SECRET` en `functions/.env` — Firebase lo carga en deploy y choca con Secret Manager (`overlaps non secret environment variable`). Emulador: `functions/.env.local`. Producción env: `functions/.env.cerebro-prime-a0729` (solo client ID + APP_URL).

| Secret / env | Uso |
|--------------|-----|
| `GOOGLE_OAUTH_CLIENT_ID` | OAuth web (`.env.cerebro-prime-a0729`) |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Secret — Drive/Docs |
| `APP_URL` | `https://cerebro-prime-a0729.web.app` |
| `ENCRYPTION_KEY` | Secret — cifrado BYOK API keys |

## Preparar y desplegar

Cada deploy incrementa **`APP_VERSION`** (+1): sidebar (`vN`) y `/api/health` quedan alineados. Fuente: `modules/cerebro-app/VERSION`.

```bash
chmod +x scripts/prepare-cerebro-deploy.sh scripts/deploy-cerebro-app.sh scripts/bump-cerebro-app-version.sh
./scripts/deploy-cerebro-app.sh   # bump + valida + build + firebase deploy (completo)
```

Desde Cursor: **`/deploy`** (skill `deploy`). Si un deploy falló tras el bump, reintentar con `--no-bump`.

Variantes:

```bash
./scripts/deploy-cerebro-app.sh --hosting      # solo frontend
./scripts/deploy-cerebro-app.sh --functions    # solo Cloud Functions
./scripts/deploy-cerebro-app.sh --rules        # firestore + storage rules
./scripts/deploy-cerebro-app.sh --prepare-only # solo validar y build
```

Manual (equivalente al deploy completo):

```bash
./scripts/prepare-cerebro-deploy.sh   # valida + build producción

cd modules/cerebro-app
firebase deploy
```

Solo hosting (sin tocar Functions):

```bash
cd modules/cerebro-app && npm run deploy:hosting
```

## Post-deploy

1. Abrir https://cerebro-prime-a0729.web.app → **Entrar con Google**
2. **Ajustes → Cerebro Profesional — Setup** (wizard 5 pasos)
3. Conectar Google, carpetas Meet, Apps Script inbox (ver [DOC-GUIDE-014](cerebro-meet-apps-script.md))
4. Configurar API key IA (Gemini u OpenAI) y automatización diaria (paso 5)
5. **Profesional** → **Sincronizar ahora** (pipeline completo)
6. Org multi-miembro: ingest + repair + grafo — ver [cerebro-app-org-graph.md](cerebro-app-org-graph.md) (`DOC-GUIDE-013`)

## Scheduler (sync diaria)

La function `scheduledMeetSync` corre cada hora y ejecuta el pipeline para usuarios con `syncSchedule.enabled`.

- Desplegar reglas: `firebase deploy --only firestore:rules,storage` (Storage requiere activarlo antes en Console)
- El índice `syncSchedule.enabled` en collection group `settings` lo gestiona Firestore como single-field automático

## Seguridad

- `firestore.rules` y `storage.rules` limitan datos a `request.auth.uid`
- Integraciones Google y LLM keys solo escribibles desde Functions (Admin SDK)
- Revisar IAM del service account de Functions para Storage

## Desarrollo local (emuladores)

No afecta producción — usa alias `local` (`demo-cerebro`):

```bash
./scripts/dev-cerebro-local.sh
```

Ver `docs/02_guides/cerebro-app-local-test.md` y `modules/cerebro-app/README.md`.
