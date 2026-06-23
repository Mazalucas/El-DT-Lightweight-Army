# Catálogo de módulos

Índice legible del segundo cerebro. Fuente canónica: [modules.yaml](modules.yaml).

## Cómo usar

| Pregunta | Respuesta |
|----------|-----------|
| ¿Qué módulos existen? | Este archivo o `modules.yaml` |
| ¿Portal humano? | [../../BRAIN.md](../../BRAIN.md) |
| ¿Crear uno nuevo? | Copiar [../../modules/_template/](../../modules/_template/) y registrar aquí |
| ¿Multi-repo Git? | Mismos `id` en `vitals/workspace.yaml` (local) |

## Módulos registrados

### `lucas-prime` — hub

- **Estado:** active
- **Path:** `.`
- **Tags:** dt, brain, orchestration

### `facturas-autonomo-es` — tool

- **Estado:** active
- **Path:** `modules/facturas-autonomo-es`
- **Dev:** **`/nueva-factura`** o `./scripts/dev-facturas-autonomo.sh`
- **Tags:** facturas, autonomo, españa, fiscal
- **Aliases:** facturas, autonomo, invoices-es
- **Plantilla Excel:** `modules/facturas-autonomo-es/assets/templates/Modelo-fra-Lucas.xlsx`

### `recordatorios` — tool

- **Estado:** active
- **Path:** `modules/recordatorios`
- **Dev:** **`/recordatorios`** o `./scripts/dev-recordatorios.sh`
- **Captura chat:** **`/recordatorio`**
- **Tags:** recordatorios, productividad, tareas
- **Guía:** `docs/02_guides/recordatorios-quickstart.md`

### `meet-notes-sync` — tool

- **Estado:** active
- **Path:** `modules/meet-notes-sync`
- **Command:** **`/sincronizar-notas-meet`**
- **Salida:** `modules/cerebro-profesional/.local/mirror/*.md`

### `cerebro-profesional` — tool

- **Estado:** active
- **Path:** `modules/cerebro-profesional`
- **Dev:** **`/cerebro-profesional`** · puerto **5182**
- **Tags:** reuniones, contactos, equipos, meet

### `tools-hub` — hub

- **Estado:** active
- **Path:** `modules/tools-hub`
- **Dev:** **`/start`** o `./scripts/dev-tools-hub.sh`
- **Tags:** hub, tools, indice, launcher, busqueda
- **Aliases:** start, launcher, tools, indice
