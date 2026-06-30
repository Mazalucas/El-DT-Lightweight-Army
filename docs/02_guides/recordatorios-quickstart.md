---
id: DOC-GUIDE-015
title: Recordatorios — quickstart
type: guide
status: canonical
owner: dt-platform
created: 2026-06-03
updated: 2026-06-03
tags:
  - recordatorios
  - modules
  - productividad
  - guide
domain:
  - modules
summary: Cómo usar recordatorios desde la app web y desde Cursor (/recordatorio).
related:
  - DOC-OV-004
priority: medium
source_of_truth: true
---

# Recordatorios — quickstart

## Qué es

Módulo **`recordatorios`** del segundo cerebro: lista privada local con categorías, tags y fechas. No confundir con `vitals/work/inbox/` (cuaderno en Git).

## Commands

| Command | Acción |
|---------|--------|
| `/recordatorios` | Abre la app web (`http://localhost:5181/`) |
| `/recordatorio …` | Crea desde el chat → cola `.local/inbox.jsonl` |

## Captura desde chat

```text
/recordatorio llamar cliente el viernes @trabajo #urgente
/recordatorio revisar PR @proyecto:facturas-autonomo-es
```

La app importa la cola al abrirse (o cada ~30 s si ya está abierta).

## Captura desde la web

1. Elegí categoría con los chips (personal, trabajo, proyecto…)
2. Escribí el título; podés usar `#tags` y `mañana` en el texto
3. Enter o **Añadir**

Atajos: `n` → foco captura · `/` → buscar

## Backup

Header **Exportar** / **Importar** — JSON local. No incluir en `/guardar`.

## Más detalle

- Módulo: [modules/recordatorios/README.md](../../modules/recordatorios/README.md)
- Contrato inbox: [modules/recordatorios/bridge/README.md](../../modules/recordatorios/bridge/README.md)
