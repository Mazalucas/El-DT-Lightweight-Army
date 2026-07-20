---
name: swiss-style
description: "When applying Swiss / International Typographic Style to UI — grid discipline, asymmetric layout, strong hierarchy. Also use for B2B, fintech, enterprise dashboards, editorial product UI, or when design-selector recommends swiss-style overlay."
metadata:
  version: 1.0.0
---

# Swiss Style (International Typographic)

Clarity through grid, typography, and asymmetric balance — not decoration.

## Canonical templates

Load via **style-templates** skill — do not invent layout from scratch.

| File | Path |
|------|------|
| Tokens | `design/templates/styles/swiss-style/tokens.css` |
| Landing | `design/templates/styles/swiss-style/landing.md` |
| Product shell | `design/templates/styles/swiss-style/product-shell.md` |

## Best For

- B2B SaaS, fintech, enterprise dashboards
- Paired with **carbon-design** or neutral custom systems
- Editorial/product marketing with substance

## Avoid

- Playful consumer apps needing whimsy
- IoT soft controls → **neumorphism** partial
- Glass-heavy spatial UI

## Principles

See `references/principles.md`. Core:

1. **Modular grid** — 12-col web; strict alignment
2. **Typographic hierarchy** — size/weight, not color alone
3. **Asymmetry** — intentional whitespace; avoid centered 3-col cliché
4. **Objective photography** — or none; no stock hero blobs

## Accessibility

- Excellent baseline: high contrast, clear hierarchy
- Avoid ultra-light weights below 16px body

## Anti-Slop Risks (medium)

- "Minimal" becomes generic gray SaaS — add one distinctive typographic or layout choice
- Grid visible lines as decoration (1970s pastiche)
- Helvetica clone without licensing consideration

## DEFER Rules

- **frontend** — CSS grid implementation
- **brand-guardian** — logo placement in asymmetric layouts

## Related Skills

- **systems/carbon-design** — frequent pairing
- **design-read** — V dial often 3–4
- **anti-slop** — catch fake swiss (centered 3-col)
