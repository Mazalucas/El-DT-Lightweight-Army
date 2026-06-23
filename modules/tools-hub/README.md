# Tools Hub

Índice interactivo de herramientas y commands del segundo cerebro Lucas Prime.

## Arrancar

```bash
/start
# o
./scripts/dev-tools-hub.sh
```

Abre `http://localhost:5180/` (puerto distinto a facturas para evitar conflicto).

## Qué indexa

- Módulos registrados en `vitals/catalog/modules.yaml`
- Commands DT en `vitals/config/commands-meta.yaml`

El catálogo se regenera en caliente al arrancar Vite (dev) o en build.

## Búsqueda

- Fuzzy search sobre nombre, id, tags, aliases y descripción
- Atajos: `/` o `⌘K` enfocan la búsqueda; flechas + Enter para navegar

## Abrir herramientas desde la UI

En modo dev, cada herramienta muestra **▶ Abrir app**: levanta el dev server vía `POST /api/launch/:moduleId` (whitelist desde `modules.yaml`) y abre la URL local. Requiere `./scripts/dev-tools-hub.sh` — no aplica al build estático sin middleware.

## Registrar una tool nueva

1. Crear módulo en `modules/{id}/`
2. Añadir entrada en `vitals/catalog/modules.yaml`
3. Recargar la página — aparece automáticamente
