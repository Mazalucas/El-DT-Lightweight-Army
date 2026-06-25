# Neumorphism — Principles

## Mechanics

- Same-hue background and element fill
- Dual shadow: light top-left, dark bottom-right (or inset for pressed)
- Subtle radius (12–20px on controls)

## Allowed Surfaces

- Toggle switches
- Media play/pause knobs
- Thermostat dial mockups
- Icon buttons on monochromatic panel

## Forbidden Surfaces

- Text fields, selects, text areas
- Navigation bars
- Data tables and charts
- Modal dialogs

## Color

- Base: `#e0e5ec` light or `#2a2d34` dark — tinted, not pure gray
- No neumorphism on colored backgrounds

## Max UI Percent

- **20%** of visible viewport controls
- Rest: flat minimal or system components

## Detection

Script flag SLOP005 — dual inset/outset shadow patterns.

## Fallback

Always design flat variant for high-contrast mode and a11y strict contexts.
