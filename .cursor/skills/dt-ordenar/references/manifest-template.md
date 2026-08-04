# Manifest — ordenar YYYY-MM-DD-{slug}

Plantilla para `vitals/work/knowledge/YYYY-MM-DD-{slug}/manifest.md`.

```markdown
---
operator_id: "{operator.id}"
session_slug: "{slug}"
created: YYYY-MM-DD
inputs:
  - source: "{path or chat-paste}"
    kind: "{md|csv|code|mixed}"
status: complete | partial
---

# Manifest — {título breve}

## Objetivo

{1–2 líneas: qué se capturó y para qué}

## Entradas procesadas

| Fuente | Tipo | Notas |
|--------|------|-------|
| … | … | … |

## Artefactos creados o actualizados

| Path | ID | Acción | Cómo encontrar |
|------|-----|--------|----------------|
| `docs/…` | DOC-… | create/merge | keywords: … |
| `vitals/work/knowledge/…/sources/…` | — | archive | índice en sources/README.md |

## Enlaces cruzados

- {DOC-ID} ↔ {DOC-ID} (`related`)

## Pendientes / defer

- [ ] …

## Sensibilidad

- Secretos redactados: {sí/no — detalle}
- PII: {sí/no}

## Siguiente paso

- `/guardar` si hay cambios versionables
- {otro ritual si aplica}
```
