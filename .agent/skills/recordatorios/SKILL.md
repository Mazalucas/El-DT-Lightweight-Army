---
name: recordatorios
description: "[Módulos] Arrancar la app web de recordatorios. Use when the user invokes /recordatorios or wants to open the reminders app."
---

# recordatorios

Inicia el módulo **`recordatorios`** — app Vite en el navegador (puerto **5181**).

Alias: `/recordatorios`, "recordatorios", "abrir recordatorios".

## Módulo

| Campo | Valor |
|-------|--------|
| ID catálogo | `recordatorios` |
| Path app | `modules/recordatorios/src` |
| Script | `scripts/dev-recordatorios.sh` |
| Captura chat | `/recordatorio` → `modules/recordatorios/.local/inbox.jsonl` |

## Pasos

1. **Resolver repo root** — Lucas Prime (`vitals/workspace.yaml` si aplica).

2. **Comprobar duplicado** — si hay dev server en **5181** sirviendo esta app, informá la URL y no levantes otro proceso.

3. **Arrancar** — desde la raíz:

   ```bash
   ./scripts/dev-recordatorios.sh
   ```

   Ejecutar en **background** (`block_until_ms: 0`).

4. **Esperar URL** — típico `http://localhost:5181/`.

5. **Entregar al usuario**:
   - URL para abrir
   - Captura rápida: barra superior + chips de categoría; atajos `n` (nuevo), `/` (buscar)
   - Desde chat: `/recordatorio texto @personal #tag mañana`
   - Datos en IndexedDB local; backup JSON desde header Exportar/Importar
   - Doc: `modules/recordatorios/README.md`

## Si falla

| Error | Acción |
|-------|--------|
| npm no encontrado | Instalar Node LTS |
| Puerto ocupado | Reportar URL alternativa de Vite |
| Sin node_modules | `cd modules/recordatorios/src && npm install` |

## No hacer

- No commitear datos de recordatorios ni `.local/`
- No pedir `/yo` solo para arrancar la app

## Related

- Captura: skill `recordatorio`
- Catálogo: `vitals/catalog/modules.yaml`
