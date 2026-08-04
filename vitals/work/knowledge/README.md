# Capturas de conocimiento (`/ordenar`)

Paquetes generados por **`/ordenar`** — trazabilidad de ingesta sin inflar `docs/`.

## Estructura por sesión

```text
vitals/work/knowledge/YYYY-MM-DD-{slug}/
  manifest.md       # índice de la sesión (siempre)
  sources/          # opcional — raw voluminoso o no destilado
    README.md       # índice de sources + keywords
```

## Convención

| Archivo | Git | Rol |
|---------|-----|-----|
| `manifest.md` | Sí | Qué entró, qué salió, IDs, keywords |
| `sources/**` | Sí | Material de respaldo; el retrieval prioriza `docs/` |
| `vitals/work/inbox/**/draft-ordenar-*` | No | Borradores locales explícitos |

Guía: `docs/02_guides/ordenar-captura-conocimiento.md` (`DOC-GUIDE-016`).
