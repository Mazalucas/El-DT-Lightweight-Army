---
name: cerebro-profesional
description: "[Módulos] Abrir app Cerebro profesional (reuniones, contactos, búsqueda). Use when the user invokes /cerebro-profesional."
---

# cerebro-profesional

App Vite puerto **5182**.

## Pasos

1. Resolver repo root (Lucas Prime).
2. Si el puerto 5182 ya sirve la app, dar la URL y no duplicar proceso.
3. Ejecutar en background:

```bash
./scripts/dev-cerebro-profesional.sh
```

4. Entregar `http://localhost:5182/` y recordar: primero **`/sincronizar-notas-meet`** si el espejo está vacío.

## Módulo

- Catálogo: `cerebro-profesional`
- Mirror: `modules/cerebro-profesional/.local/mirror/`
