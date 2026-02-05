---
description: Convenciones de frontend, componentes, estado, accesibilidad
globs: "**/*.tsx, **/*.vue, **/*.jsx, **/frontend/**/*, **/components/**/*"
---

# Frontend y UI

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
