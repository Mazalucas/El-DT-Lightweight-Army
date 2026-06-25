---
name: bauhaus-style
description: "When applying adapted Bauhaus visual language — geometric forms, primary colors, bold composition. Also use for creative agencies, education, portfolio landings, or storytelling-driven marketing when design-selector recommends bauhaus-style."
metadata:
  version: 1.0.0
---

# Bauhaus Style (Adapted for UI)

Geometric clarity and primary color discipline — expressive but structured.

## Canonical templates

| File | Path |
|------|------|
| Tokens | `design/templates/styles/bauhaus-style/tokens.css` |
| Landing | `design/templates/styles/bauhaus-style/landing.md` |
| Product shell | `design/templates/styles/bauhaus-style/product-shell.md` |

## Best For

- Creative agencies, portfolios, education
- Storytelling landings with art-direction budget
- Differentiation from generic minimal SaaS

## Avoid

- Fintech, healthcare, gov (trust surfaces)
- Dense admin dashboards
- a11y-strict without careful contrast testing

## Principles

See `references/principles.md`.

## Accessibility

- Primary red/blue/yellow combos fail contrast easily — test all text pairs
- Do not use color alone for state; add icons or labels
- slop_risk: low-medium when intentional; high when pasted shapes without system

## Anti-Slop Risks

- Random circles/triangles as empty decoration
- Primary colors without grid → children's clip art
- Bauhaus label on standard Tailwind landing

## DEFER Rules

- **brand-guardian** — brand may conflict with primary palette
- **frontend** — SVG geometric assets

## Related Skills

- **patterns/landing-patterns** — storytelling layouts
- **presentation-design** — bold slide geometry
- **anti-slop** — verify intentionality
