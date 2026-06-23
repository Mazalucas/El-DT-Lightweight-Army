---
name: exit
description: "[Rutina] Cerrar dev servers Vite de módulos Cerebro Prime (Tools Hub, recordatorios, cerebro profesional, facturas). Use when the user invokes /exit or wants to stop local servers."
---

# exit

Cierra **todas** las instancias de dev servers Vite levantadas por los módulos del segundo cerebro en esta máquina.

Alias: `/exit`, `/Exit`, "cerrar servers", "parar vite", "stop dev servers".

## Alcance

| Módulo | Puerto habitual |
|--------|-----------------|
| Facturas autónomo | 5173 |
| Tools Hub | 5180 |
| Recordatorios | 5181 |
| Cerebro profesional | 5182 |

Solo se cierran procesos cuyo comando incluye el path del módulo bajo `modules/` — **no** se mata cualquier cosa en esos puertos si es otra app.

## Pasos (ejecutar en orden)

1. **Resolver repo root** — workspace actual (Cerebro Prime).

2. **Ejecutar script** — desde la raíz:

   ```bash
   bash ./scripts/stop-dev-servers.sh
   ```

   Opcional para preview sin matar procesos: `--dry-run`.

3. **Entregar al usuario**:
   - Resumen de qué se cerró (módulo + puerto)
   - Si no había nada corriendo, decirlo explícitamente
   - Si algún puerto estaba ocupado por otra app, listar lo omitido

4. **Verificación opcional** — comprobar que los puertos quedaron libres:

   ```bash
   lsof -i :5173 -i :5180 -i :5181 -i :5182 2>/dev/null || true
   ```

   Solo reportar procesos que sigan siendo de módulos del repo.

## Si falla

| Error | Acción |
|-------|--------|
| `lsof` no encontrado | Indicar instalar herramientas de desarrollo macOS o usar `brew install lsof` |
| Proceso no responde a SIGTERM | Informar pid; sugerir cierre manual con `kill -9 <pid>` solo si el usuario lo pide |
| Puerto sigue ocupado por otra app | No forzar kill; explicar qué proceso es |

## No hacer

- No pedir `/yo` (no escribe en Git ni modifica el repo).
- No usar `kill -9` salvo que el usuario lo pida explícitamente tras un fallo de SIGTERM.
- No matar procesos en puertos conocidos si no pertenecen a `modules/*` de este repo.

## Related

- Arrancar Tools Hub: skill `start` · `/start`
- Módulos: `vitals/catalog/modules.yaml` · `BRAIN.md`
- Script: `scripts/stop-dev-servers.sh`
