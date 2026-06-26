---
name: nueva-factura
description: "[Módulos] Arrancar la app local de facturas autónomo (España). Use when the user invokes /nueva-factura or /NuevaFactura."
---

# nueva-factura

Inicia el módulo **`facturas-autonomo-es`** — app Vite en el navegador para crear facturas de autónomo.

Alias de invocación: `/nueva-factura`, `/NuevaFactura`, "nueva factura".

## Módulo

| Campo | Valor |
|-------|--------|
| ID catálogo | `facturas-autonomo-es` |
| Path app | `apps/facturas/src` |
| Script | `scripts/dev-facturas-autonomo.sh` (desde raíz del repo) |

## Pasos (ejecutar en orden)

1. **Resolver repo root** — workspace actual (Lucas Prime). Si existe `vitals/workspace.yaml`, el módulo vive en el hub (`git_root: .`); no confundir con otros proyectos del manifest.

2. **Comprobar si ya corre** — si hay un dev server en el puerto habitual de Vite (5173) sirviendo esta app, informá la URL y **no** levantes otro proceso duplicado.

3. **Arrancar** — desde la raíz del repo:

   ```bash
   ./scripts/dev-facturas-autonomo.sh
   ```

   Ejecutar en **background** (`block_until_ms: 0` o equivalente) porque `vite` no termina.

4. **Esperar URL** — leer stdout hasta ver `Local:` (**siempre** `http://localhost:5173/` — puerto fijo; otro puerto = IndexedDB vacío y el emisor “no guardado”). El script cierra instancias viejas de esta app en :5173 antes de arrancar.

5. **Entregar al usuario**:
   - URL para abrir en el navegador
   - Recordatorio: primera vez configura **Emisor** (NIF, IBAN…) en el modal; datos solo en IndexedDB local
   - **Exportar confirmada** → PDF/PNG en Google Drive (`Facturas/AAAA MM - MES/`)
   - Atajos: clientes guardados, emitir, PDF (imprimir), PNG descarga
   - Doc: `apps/facturas/README.md` (local; gitignored)

## Si falla

| Error | Acción |
|-------|--------|
| `node` / `npm` no encontrado | Indicar instalar Node LTS |
| `npm install` falla | Mostrar error; sugerir `cd apps/facturas/src && npm install` manual |
| Puerto ocupado por otra app | Indicar URL alternativa de Vite o cerrar el otro proceso |
| Falta `node_modules` | El script corre `npm install` automáticamente |

## No hacer

- No commitear datos del emisor ni facturas (viven en IndexedDB / backup JSON local).
- No editar el plan en `.cursor/plans/`.
- No pedir `/yo` solo para arrancar la app (no escribe en Git); sí recordarlo si después va a `/guardar`.

## Related

- Catálogo: `vitals/catalog/modules.yaml` → `facturas-autonomo-es`
- Portal: `BRAIN.md`
