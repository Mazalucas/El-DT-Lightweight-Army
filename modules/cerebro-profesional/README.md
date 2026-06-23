# Cerebro profesional

App local para **reuniones**, **contactos**, **equipos**, **proyectos** y **búsqueda** sobre notas Meet (Gemini).

## Ritual

```text
/sincronizar-notas-meet  →  /cerebro-profesional  →  (opcional) /procesar-reuniones
```

1. **Sync** — genera `.md` en `.local/mirror/` (requiere OAuth en `meet-notes-sync` para contenido completo).
2. **App** — reindexa el espejo en IndexedDB; buscá y filtrá.
3. **Procesar** — en Cursor, enriquecé metadatos vía `analysis-inbox.jsonl`.

## Config

```bash
mkdir -p modules/cerebro-profesional/.local
cp modules/cerebro-profesional/config.example.yaml modules/cerebro-profesional/.local/config.yaml
```

## Arranque

```bash
./scripts/dev-cerebro-profesional.sh
```

URL: **http://localhost:5182/** — command **`/cerebro-profesional`**

## Datos

| Path | Uso |
|------|-----|
| `.local/mirror/*.md` | Espejo legible (IA + app) |
| `.local/manifest.jsonl` | Índice procesado / pendiente |
| `.local/analysis-inbox.jsonl` | Resultados de `/procesar-reuniones` |
| `.local/cerebro-store.json` | Copia de IndexedDB (contactos, equipos, análisis) — se restaura al abrir la app |

No commitear `.local/`.

Al abrir la app se **restaura** `cerebro-store.json` si el navegador vació IndexedDB. Si no hay snapshot pero sí hay `mirror/*.md`, se importa automáticamente.

Procesar todas las reuniones (contactos, proyectos, temas, action items):

```bash
node modules/cerebro-profesional/scripts/process-all-meetings.mjs
# o sync + proceso:
./scripts/process-cerebro-all.sh
```
