---
name: neumorphism
description: "When applying partial neumorphism — soft extruded controls for IoT, smart home, or tactile toggles. Also use when the user mentions 'neumorphism,' 'soft UI,' 'extruded buttons,' or neumorphism-partial overlay. Never full UI; max ~20% of surface. Poor a11y — avoid forms and text-heavy views."
metadata:
  version: 1.0.0
---

# Neumorphism (Partial Only)

Soft dual-shadow extrusion simulating physical controls — niche, not default.

## Canonical templates

| File | Path |
|------|------|
| Tokens | `design/templates/styles/neumorphism/tokens.css` |
| Controls | `design/templates/styles/neumorphism/controls.md` |
| Product shell | `design/templates/styles/neumorphism/product-shell.md` |

## Best For

- IoT toggles, smart home dashboards (see industries smart-home)
- Prototype demos of physical-adjacent controls
- ≤20% of UI surface

## Avoid

- Full app chrome, forms, tables (**a11y: poor**)
- Fintech, healthcare, gov (excluded in a11y strict)
- Login/auth flows

## Principles

See `references/principles.md`.

## Accessibility

- Contrast between element and background often fails WCAG
- Never use for text inputs or primary reading UI
- Provide non-neumorphic high-contrast mode

## Anti-Slop Risks (medium)

- 2020 trend revival on entire landing page
- Inset shadows on cards stacked (SLOP005)
- Low contrast gray-on-gray buttons

## DEFER Rules

- **frontend** — shadow CSS implementation
- **accessibility-design** — validate any neumorphic control

## Related Skills

- **anti-slop** — SLOP005 detection
- **styles/glassmorphism** — don't combine both at scale
- **systems/material-design** — prefer Material toggles for a11y
