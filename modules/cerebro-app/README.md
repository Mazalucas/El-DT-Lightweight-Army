# Cerebro App — webapp unificada (Firebase)

SPA en la nube: auth Google, sync Meet vía Drive API, cerebro profesional e IA con BYOK.

**Copiloto in-app:** ver [`docs/CEREBRO.md`](docs/CEREBRO.md) — burbuja, `#/cerebro`, contexto vivo, ambient UI, planes confirmables.

## Requisitos producción

1. Proyecto Firebase con Auth (Google), Firestore, Storage, Functions, Hosting
2. Google Cloud OAuth **Web client** con redirect: `{APP_URL}/api/auth/google/callback`
3. Variables en Functions (Firebase console → Functions → entorno):

| Variable | Uso |
|----------|-----|
| `GOOGLE_OAUTH_CLIENT_ID` | OAuth web |
| `GOOGLE_OAUTH_CLIENT_SECRET` | OAuth web |
| `GOOGLE_PICKER_API_KEY` | Google Picker (selector de carpetas en Ajustes) |
| `APP_URL` | URL pública Hosting |
| `ENCRYPTION_KEY` | Cifrado BYOK API keys |
| `MAIL_API_KEY` | Resend — emails de invitación org (opcional; sin key: copiar enlace en Admin) |
| `MAIL_FROM` | Remitente verificado en Resend |
| `INVITE_TOKEN_PEPPER` | Secret — hash de tokens de invitación (obligatorio en prod) |

**Credenciales OAuth:** nunca versionar `client_secret*.json` en la raíz del repo (ya en `.gitignore`). Usar `firebase functions:secrets:set GOOGLE_OAUTH_CLIENT_SECRET`.

### Empresa (SaaS multi-tenant)

- Crear org: Ajustes → Empresa o `#/settings?section=empresa`
- Invitar: `#/org/{id}/admin` — enlace copiable si no hay email
- Unirse: `#/join/{token}` o solicitud por dominio corporativo
- **Privacidad:** admins ven datos que los miembros ingieren al espacio org (no el store personal)

4. Copiar `.env.development.local.example` → `src/.env.development.local` (solo emuladores locales)
5. Copiar `.env.production.local.example` → `src/.env.production.local` (Firebase web config producción)

Proyecto producción: **`cerebro-prime-a0729`** · URL: https://cerebro-prime-a0729.web.app

## Desarrollo local

```bash
./scripts/dev-cerebro-local.sh
```

Guía completa: [`docs/02_guides/cerebro-app-local-test.md`](../../docs/02_guides/cerebro-app-local-test.md)

| URL | Qué es |
|-----|--------|
| http://localhost:5190 | App |
| http://localhost:4000 | Emulator UI |
| Login | **Entrar (dev local)** |

Sync Drive en local: `GOOGLE_OAUTH_*` en `functions/.env`. Parar: `./scripts/dev-cerebro-local.sh --stop`

## Deploy

```bash
./scripts/prepare-cerebro-deploy.sh          # valida + build producción
cd modules/cerebro-app
firebase functions:secrets:set GOOGLE_OAUTH_CLIENT_SECRET
firebase functions:secrets:set ENCRYPTION_KEY
firebase functions:secrets:set INVITE_TOKEN_PEPPER
# Opcional: firebase functions:secrets:set MAIL_API_KEY
firebase deploy --only functions,firestore:rules,firestore:indexes,hosting
```

Guía: [`docs/02_guides/cerebro-app-deploy.md`](../../docs/02_guides/cerebro-app-deploy.md)

## Rutas

| Ruta | Módulo |
|------|--------|
| `/` | Home / catálogo |
| `/profesional` | Reuniones, pipeline, IA, todos |
| `/settings` | Google, carpetas Drive, API keys |

## API

Todas bajo `/api/*` vía Cloud Function `api`. Auth: `Authorization: Bearer {Firebase ID token}`.
