---
id: DOC-GUIDE-010
title: "Cerebro profesional — setup"
type: guide
status: active
owner: dt
updated: "2026-06-04"
tags: [cerebro, meet, gemini, reuniones]
summary: "Configurar sync de notas Meet y la app de búsqueda profesional."
related: [DOC-OV-001]
priority: medium
source_of_truth: true
---

# Cerebro profesional — setup

## Módulos

| Módulo | Command |
|--------|---------|
| Sync `.gdoc` → `.md` | `/sincronizar-notas-meet` |
| App búsqueda y timelines | `/cerebro-profesional` |
| Solo índice | `/indexar-reuniones` |
| Análisis Cursor | `/procesar-reuniones` |

## 1. Config local

```bash
mkdir -p modules/cerebro-profesional/.local
cp modules/cerebro-profesional/config.example.yaml modules/cerebro-profesional/.local/config.yaml
```

Ajustá `sourcePath` o la lista `sources` si tus carpetas Meet están en otra ruta. Podés definir `teamId: innovacion` (u otro) por carpeta.

## 2. OAuth Google (contenido completo)

1. Google Cloud → habilitar **Google Docs API** y **Google Drive API**.
2. Credenciales → OAuth client ID → **Desktop app** → descargar JSON como `modules/meet-notes-sync/.local/google-credentials.json`.
3. Tipo **Desktop (Escritorio)** — no cambiar a Web. En Escritorio no se configuran redirect URIs a mano; el flujo usa loopback en `localhost`.
4. `cd modules/meet-notes-sync && npm install && npm run auth`
5. `./scripts/sync-meet-notes.sh`

Sin OAuth: se crean stubs con metadatos; export manual a `Meet Recordings/_export/`.

## 3. Notas compartidas (Apps Script)

Si recibís transcripciones compartidas que no están en tu **Meet Recordings**, usá el inbox con Apps Script:

- Guía canónica: [cerebro-meet-apps-script.md](cerebro-meet-apps-script.md) (`DOC-GUIDE-012`)
- Script: `modules/cerebro-app/assets/meet-sync-inbox/MeetSyncInbox.gs`
- En local: añadí la ruta Desktop de la carpeta inbox en `sources[]` de `config.yaml`

## 4. App

```bash
./scripts/dev-cerebro-profesional.sh
```

Abrir http://localhost:5182/ → menú **Acciones** (sync, importar, etc.) → buscar y filtrar.

## Paridad con cerebro-app (nube)

| Local | Cloud (cerebro-app) |
|-------|---------------------|
| `sources[].path` en `config.yaml` | `meetSources[].driveFolderId` en Ajustes → Setup |
| Desktop OAuth (`npm run auth`) | OAuth web en Ajustes paso 1 |
| Menú Acciones (:5182) | Profesional → Acciones + «Sincronizar ahora» |
| `./scripts/sync-meet-notes.sh` | `POST /api/sync/pipeline` + cron diario |
| Análisis Cursor `/procesar-reuniones` | IA integrada (API key en Ajustes) |

Deploy nube: [cerebro-app-deploy.md](cerebro-app-deploy.md) (`DOC-GUIDE-011`).

## Datos (no se pierden al reiniciar)

| Archivo | Qué guarda |
|---------|------------|
| `.local/mirror/*.md` | Texto de cada reunión (fuente tras sync) |
| `.local/cerebro-store.json` | Copia de la app: reuniones, contactos, equipos, proyectos |
| IndexedDB (navegador) | Caché rápida; puede vaciarse al reiniciar |

Al abrir http://localhost:5182/ la app **restaura** `cerebro-store.json` si el navegador está vacío. Tras importar o aplicar análisis, guarda de nuevo en disco.

Regenerar el store sin abrir el navegador:

```bash
node modules/cerebro-profesional/scripts/rebuild-store-from-mirror.mjs
```

Todo en `modules/cerebro-profesional/.local/` (no Git).
