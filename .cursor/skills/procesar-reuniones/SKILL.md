---
name: procesar-reuniones
description: "[Módulos] Analizar notas .md del cerebro profesional y escribir analysis-inbox.jsonl. Use when the user invokes /procesar-reuniones."
---

# procesar-reuniones

**Solo Cursor** — no usar APIs externas desde la app.

## Entrada

Archivos en `modules/cerebro-profesional/.local/mirror/*.md` con frontmatter (participantes, resumen).

## Salida

Append una línea JSON por reunión en `modules/cerebro-profesional/.local/analysis-inbox.jsonl`:

```json
{
  "analysisVersion": 1,
  "id": "uuid",
  "meetingId": "doc_…",
  "people": [{ "displayName": "María" }],
  "summary": "…",
  "themes": [],
  "objectives": [],
  "actionItems": [],
  "projects": ["Milø"],
  "confidence": "high",
  "needsReview": false
}
```

Schema: `modules/cerebro-profesional/bridge/analysis-inbox.schema.json`

## Pasos

1. Listar reuniones con mirror existente; priorizar `analysisStatus: pending` si hay manifest.
2. Leer cada `.md`; extraer sin inventar asistentes no mencionados.
3. Append JSONL; no commitear `.local/`.
4. Indicar al usuario que abra la app y recargue (o drenaje futuro vía API inbox).

## Lotes

Procesar 5–10 por turno si hay 100+ archivos.

## Qué hace la IA (match inteligente)

- **Personas:** unificar nombres (María / María García), no inventar asistentes.
- **Proyectos / temas:** extraer de título + cuerpo (Milø, BrandBoost, clientes).
- **Equipos:** sugerir `teamIds` si el contexto es claro; si no, `needsReview: true`.
- **Action items:** lista en `actionItems` para revisión humana.

Tras escribir el JSONL, el usuario abre **`/cerebro-profesional`** y sincroniza/reindexa: la app **importa** las filas pendientes del inbox y actualiza IndexedDB (búsqueda y filtros).

La app también infiere proyectos por **palabras en el título** sin IA; el skill refina y fusiona contactos.
