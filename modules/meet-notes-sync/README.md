# meet-notes-sync

Exporta **Notas de Gemini** (`.gdoc` en Google Drive) a Markdown en el espejo del cerebro profesional.

## Destino del espejo

```text
modules/cerebro-profesional/.local/mirror/{meetingId}.md
modules/cerebro-profesional/.local/manifest.jsonl
```

## Config

Copiá el ejemplo y ajustá la ruta de Drive si hace falta:

```bash
cp modules/cerebro-profesional/config.example.yaml modules/cerebro-profesional/.local/config.yaml
```

## OAuth (Google Docs API)

1. [Google Cloud Console](https://console.cloud.google.com/) → proyecto → APIs → habilitar **Google Docs API** y **Google Drive API**.
2. Credenciales → **OAuth client ID** → Desktop app → descargar JSON.
3. Guardar como `modules/meet-notes-sync/.local/google-credentials.json`.
4. Tipo **Desktop (Escritorio)** — correcto para local. No hace falta crear cliente Web ni editar redirect URIs en consola (en Escritorio no aparece ese campo; Google acepta loopback en `localhost`).
5. Autenticar (incluye permisos de metadatos Drive para emails compartidos):

```bash
cd modules/meet-notes-sync && npm install && npm run auth
```

Si ya tenías token anterior, **volvé a correr `npm run auth`** tras actualizar scopes.

## Uso

```bash
# Solo índice (manifest)
npm run scan

# Sync completo (API + stubs si falta OAuth)
npm run sync

# Límite para pruebas
npx tsx src/cli.ts --limit=5
```

Desde Cursor: **`/sincronizar-notas-meet`**

## Fallback

Sin OAuth: se crean `.md` stub con metadatos del nombre de archivo. Podés exportar Docs a `Meet Recordings/_export/*.txt` y volver a sincronizar.

## Git

`.local/` no se versiona.
