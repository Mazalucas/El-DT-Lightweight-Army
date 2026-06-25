---
description: Convenciones de frontend, componentes, estado, accesibilidad
globs: "**/*.tsx, **/*.vue, **/*.jsx, **/frontend/**/*, **/components/**/*"
alwaysApply: false
---

# Frontend y UI

Stack default del DT: ver regla `08-stack-web-default` y `vitals/data/engineering/web-stack.yaml`.

## Stack default (proyecto web nuevo)

- **Bundler**: Vite
- **UI**: React (componentes funcionales)
- **Backend client**: Firebase JS SDK modular (v9+)
- **Alternativas permitidas**: React solo, Vite solo — según `web-stack.yaml`

Si el repo ya usa otro framework, respetarlo (soft default).

## Componentes

- Usar componentes funcionales
- Extraer hooks para lógica reutilizable
- Colocar estilos cerca de componentes
- Preferir composición sobre herencia

## Estado

- Estado local para UI; estado global solo cuando cruza muchos componentes
- Evitar prop drilling excesivo; considerar context o state management

## Accesibilidad

- Atributos ARIA cuando sea necesario
- Labels en formularios
- Contraste de colores
- Navegación por teclado

## Performance

- Lazy load de rutas/componentes pesados
- Memoización cuando el costo de re-render es alto
- Imágenes optimizadas

## Reutilización (reuse-first)

Regla transversal: `15-engineering-reuse` · skill `frontend` · `DOC-REF-006`.

- **No duplicar componentes** — buscar en `components/`, `ui/`, hooks existentes; variant props antes de archivo nuevo
- **Tokens semánticos** del design system o Atelier — no hex sueltos si hay handoff
- **Handoff Atelier**: implementar `component-specs` tal cual (skill `frontend/references/atelier-handoff.md`)
- **Composición** sobre copiar markup entre páginas
