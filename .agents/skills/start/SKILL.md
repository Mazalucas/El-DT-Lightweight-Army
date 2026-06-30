---
name: start
description: "[Módulos] Abrir Cerebro App — webapp unificada (Firebase). Use when the user invokes /start or wants the main app."
---

# start

Inicia **`cerebro-app`** — webapp unificada en el navegador (puerto dev **5190**; producción vía Firebase Hosting).

## Módulo

| Campo | Valor |
|-------|--------|
| ID catálogo | `cerebro-app` |
| Path | `modules/cerebro-app/src` |
| Script | `./scripts/dev-cerebro-app.sh` |
| URL dev | `http://localhost:5190/` |
| Deploy | `/deploy` → `./scripts/deploy-cerebro-app.sh` |

## Pasos

1. Comprobar si ya corre en **5190** — no duplicar.
2. Arrancar en background:

   ```bash
   ./scripts/dev-cerebro-app.sh
   ```

3. Para API completa en local, en otra terminal:

   ```bash
   cd modules/cerebro-app && firebase emulators:start
   ```

4. Entregar URL + recordar configurar `src/.env.local` (Firebase web) y variables Functions (ver `modules/cerebro-app/README.md`).

## Rutas

- `#/` — Home
- `#/profesional` — Reuniones, pipeline, IA
- `#/settings` — Google OAuth, carpetas Drive, API keys

Facturas autónomo: app local separada — **`/nueva-factura`** (`apps/facturas`, gitignored).

## Related

- `modules/cerebro-app/README.md`
- Legacy local: `/tools-hub` → `tools-hub` :5180
