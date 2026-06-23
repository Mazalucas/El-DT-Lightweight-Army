---
id: DOC-GUIDE-012
title: "Cerebro App — test local"
type: guide
status: active
owner: dt
updated: "2026-06-10"
tags: [cerebro, local, emulators, qa]
summary: "Probar Cerebro App en local con emuladores Firebase antes del deploy."
related: [DOC-GUIDE-011]
priority: high
source_of_truth: true
---

# Cerebro App — test local

## Un comando

```bash
./scripts/dev-cerebro-local.sh
```

Levanta **emuladores Firebase** (Auth, Functions, Firestore, Storage) + **Vite** en http://localhost:5190

Parar emuladores:

```bash
./scripts/dev-cerebro-local.sh --stop
```

## Checklist de prueba

### 1. Auth y navegación

1. Abrir http://localhost:5190
2. Clic **Entrar (dev local)** — usa Auth emulator (`dev@cerebro.local`)
3. Recorrer: **Inicio** → **Profesional** → **Facturas** → **Ajustes**

### 2. Config in-app (sin terminal)

En **Ajustes**:

- [ ] Añadir carpeta Meet (Folder ID + etiqueta) — guardar
- [ ] Configurar carpeta export facturas
- [ ] Guardar API key Gemini u OpenAI → **Probar conexión**

### 3. Profesional (sin Google OAuth)

- [ ] Crear recordatorio en la sección Todos
- [ ] Ver stats en dashboard

### 4. Sync Drive (requiere OAuth real)

En `modules/cerebro-app/functions/.env.local`:

```env
GOOGLE_OAUTH_CLIENT_ID=tu-client-id
GOOGLE_OAUTH_CLIENT_SECRET=tu-secret
APP_URL=http://localhost:5190
```

Reiniciar emuladores. En **Ajustes** → **Conectar Google** → pipeline en **Profesional**:

1. Indexar
2. Sincronizar
3. Importar al store
4. Analizar con IA (requiere API key en Ajustes)

Redirect URI en Google Cloud: `http://localhost:5190/api/auth/google/callback`  
(vía proxy Vite → emulador Functions)

### 5. Facturas

- [ ] Guardar emisor
- [ ] Crear borrador
- [ ] Emitir + Drive (requiere Google conectado + carpeta export)

### 6. Emulator UI

http://localhost:4000 — inspeccionar Firestore, Auth, Storage, logs Functions.

## Archivos locales (no Git)

| Archivo | Uso |
|---------|-----|
| `modules/cerebro-app/src/.env.development.local` | `VITE_USE_EMULATORS=true` + config demo |
| `modules/cerebro-app/functions/.env.local` | `ENCRYPTION_KEY`, OAuth opcional (emulador) |
| `modules/cerebro-app/.firebaserc` | project id `demo-cerebro` |

## Troubleshooting

| Problema | Solución |
|----------|----------|
| API 404 | Emuladores no listos — esperar o `./scripts/dev-cerebro-local.sh --stop` y reintentar |
| Login Google falla en local | Usar **Entrar (dev local)** |
| Sync error | Completar `GOOGLE_OAUTH_*` en `functions/.env` |
| IA error | API key en Ajustes + probar conexión |
| Puerto 5190 ocupado | `/exit` o matar proceso Vite |

## Solo SPA (sin API)

```bash
./scripts/dev-cerebro-app.sh
```

Útil solo para UI estática; las llamadas `/api/*` fallarán sin emuladores.
