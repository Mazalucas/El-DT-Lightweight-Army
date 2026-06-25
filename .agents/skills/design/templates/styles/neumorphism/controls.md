> **IA:** implementá desde este Markdown — [`../../PROTOCOL.md`](../../PROTOCOL.md). No ejecutes scripts de preview.

# Neumorphism — Controls Template

**Cuota:** ≤20% de la UI total · **No** usar en formularios largos

## Componentes permitidos

| Control | Extruded | Pressed (active) |
|---------|----------|------------------|
| Toggle | `--shadow-extruded` | `--shadow-pressed` |
| Slider thumb | circle extruded | track inset |
| Icon button | 48px circle | pressed on active |
| Metric card | single KPI | — |

## CSS pattern

```css
.neu-extruded {
  background: var(--color-base);
  box-shadow: var(--shadow-extruded);
  border-radius: var(--radius-control);
}
.neu-pressed {
  box-shadow: var(--shadow-pressed);
}
```

## A11y obligatorio

- Añadir `border: var(--shadow-flat-border)` si contraste &lt; 3:1
- Label visible en toggles
- No depender solo de sombra para on/off — añadir color acento en ON

## Prohibido

- Inputs de texto neumórficos largos
- Toda la página con mismo base color sin jerarquía tipográfica
