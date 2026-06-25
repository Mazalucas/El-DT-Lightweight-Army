---
name: responsive-layout
description: "When defining breakpoints, mobile-first layout behavior, or adaptive patterns across viewports. Also use when the user mentions 'responsive,' 'breakpoints,' 'mobile-first,' 'tablet layout,' 'viewport,' or design-selector checklist responsive 375/768/1024/1440."
metadata:
  version: 1.0.0
---

# Responsive Layout

Layout behavior across viewports — mobile-first, content-driven breakpoints.

## Standard Breakpoints (Atelier)

| Name | Width | Typical use |
|------|-------|-------------|
| xs | 375px | Mobile min (iPhone SE) |
| sm | 768px | Tablet portrait |
| md | 1024px | Tablet landscape / small laptop |
| lg | 1440px | Desktop |
| xl | 1920px | Wide (optional max-width container) |

Verify at all five during **anti-slop** pre-delivery.

## Mobile-First Rules

1. Default CSS = mobile layout
2. Enhance with `min-width` media queries
3. Touch targets before hover states
4. Collapse nav to drawer below md

## Pattern Behaviors

| Pattern | Mobile | Desktop |
|---------|--------|---------|
| Landing hero | Stack vertical | 7/5 split |
| Dashboard KPIs | 2×2 grid | 4-column strip |
| Data table | Horizontal scroll or card rows | Full table |
| Auth card | Full width −32px margin | 400px centered |
| Sidebar app | Hidden drawer | Fixed 256px |

## Typography Scale

- Reduce hero size on xs (clamp or step down)
- Body stays ≥16px on mobile product UI

## Images & Media

- `srcset` / responsive images
- No horizontal overflow from fixed-width embeds

## System Alignment

- Carbon: 16-col grid breakpoints
- Material: compact / medium / expanded window sizes
- Apple: size classes (Compact / Regular)

## DEFER Rules

- **frontend** — CSS/Tailwind breakpoint implementation

## Related Skills

- **ui-templates** — template responsive notes
- **patterns/dashboard-patterns** — KPI collapse
- **accessibility-design** — touch targets
- **component-specs** — per-component responsive table
