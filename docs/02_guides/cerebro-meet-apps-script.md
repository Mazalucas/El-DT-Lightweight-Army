---
id: DOC-GUIDE-012
title: "Cerebro — Apps Script inbox para notas Meet compartidas"
type: guide
status: active
owner: dt
updated: "2026-06-10"
tags: [cerebro, meet, drive, apps-script]
summary: "Copiar automáticamente notas Gemini compartidas a una carpeta inbox que Cerebro puede sincronizar."
related: [DOC-GUIDE-010, DOC-GUIDE-011]
priority: high
source_of_truth: true
---

# Apps Script — inbox de notas Meet compartidas

Cuando otra persona es dueña de la reunión, Gemini puede compartirte el Doc sin que aparezca en tu carpeta **Meet Recordings**. Este script copia esas notas a una carpeta tuya que configurás en Cerebro.

## Requisitos

- Cuenta Google con acceso a Drive
- Carpeta destino creada (p. ej. `Cerebro/Meet Inbox`)
- Cerebro App con Google conectado

## Pasos

### 1. Crear carpeta inbox

1. En [Google Drive](https://drive.google.com), creá una carpeta, por ejemplo `Cerebro/Meet Inbox`.
2. Abrí la carpeta y copiá el **Folder ID** de la URL: `https://drive.google.com/drive/folders/XXXXXXXX`.

### 2. Añadir la carpeta en Cerebro

En **Ajustes → Cerebro Profesional — Setup → paso 2**, añadí la fuente con tipo **Inbox compartidos (Apps Script)**.

### 3. Instalar el script

1. Abrí [script.google.com](https://script.google.com) → **Nuevo proyecto**.
2. Pegá el contenido de [`modules/cerebro-app/assets/meet-sync-inbox/MeetSyncInbox.gs`](../../modules/cerebro-app/assets/meet-sync-inbox/MeetSyncInbox.gs).
3. Reemplazá `PEGAR_FOLDER_ID_AQUI` por tu Folder ID.
4. Guardá el proyecto.

### 4. Autorizar y programar

1. Ejecutá manualmente `copySharedGeminiNotesToInbox` una vez y autorizá permisos de Drive.
2. **Triggers** (reloj) → **Añadir trigger**:
   - Función: `copySharedGeminiNotesToInbox`
   - Evento: **Temporizador** → **Día del temporizador** → hora deseada (p. ej. 06:00–07:00).
3. Verificá en la carpeta inbox que aparecen copias de notas `… - Notas de Gemini`.

### 5. Sincronizar en Cerebro

En **Profesional → Sincronizar ahora** (o la sync automática diaria), Cerebro leerá esa carpeta como cualquier otra fuente Meet.

## Equivalencia local (cerebro-profesional :5182)

| Cloud (cerebro-app) | Local |
|---------------------|-------|
| `meetSource` con `sourceType: shared_inbox` + Folder ID | Ruta Desktop a la misma carpeta en `config.yaml` → `sources[]` |
| Apps Script copia a Drive | La misma carpeta se sincroniza vía Google Drive Desktop |
| `/api/sync/pipeline` | `./scripts/sync-meet-notes.sh` + importar en app |

Ejemplo local en `modules/cerebro-profesional/.local/config.yaml`:

```yaml
sources:
  - path: "~/Library/CloudStorage/GoogleDrive-…/My Drive/Cerebro/Meet Inbox"
    sourceType: shared_inbox  # convención documental; opcional en YAML
```

## Solución de problemas

| Síntoma | Qué revisar |
|---------|-------------|
| Script no copia nada | ¿Hay docs compartidos con sufijo `- Notas de Gemini`? |
| Cerebro no ve archivos | Folder ID correcto en fuente + ejecutar script al menos una vez |
| Duplicados | El script evita copiar si ya existe `cerebro-source-doc:{id}` en description |

## Related docs

- [Cerebro profesional — setup](cerebro-profesional-setup.md) (`DOC-GUIDE-010`)
- [Cerebro App — deploy](cerebro-app-deploy.md) (`DOC-GUIDE-011`)
