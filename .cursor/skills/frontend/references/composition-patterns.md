# Composition patterns (frontend)

Preferir **composición sobre herencia** (regla `20-frontend-ui`).

## Patrones recomendados

### Compound components

```tsx
<Card>
  <Card.Header title="Reports" />
  <Card.Body>{children}</Card.Body>
</Card>
```

Reutilizar `Card` existente; no `ReportCard` duplicado si solo cambia contenido.

### Variant props

Un componente con `variant: 'default' | 'compact' | 'destructive'` en lugar de tres archivos.

### Render props / slots

`icon?: ReactNode`, `footer?: ReactNode` — extender API sin fork.

### Hooks para lógica

- Estado y fetch en `useReports()` — reutilizar en múltiples vistas
- No duplicar `useState` + `useEffect` idénticos

## Anti-patterns

- Wrapper div-only sin valor → usar fragment o composición
- Prop drilling >3 niveles → context existente o state manager del repo
- Styled copy-paste → token o `cn()` con clases del sistema

## Extraer componente nuevo

Solo cuando:

- Se usa en ≥2 lugares, o
- El spec Atelier define componente con contrato propio, o
- El archivo padre supera ~200 líneas por UI mezclada
