---
name: carbon-design
description: "When designing enterprise B2B, fintech, healthcare, gov, or data-dense dashboards with IBM Carbon. Also use when the user mentions 'Carbon Design,' 'IBM Carbon,' '@carbon/react,' 'enterprise dashboard,' or WCAG-strict product UI. Preferred for trust-heavy and analytics surfaces."
metadata:
  version: 1.0.0
---

# Carbon Design System

IBM Carbon — enterprise-grade, accessibility-first, data-dense UI.

## Canonical templates

| Superficie | Spec |
|------------|------|
| Homepage | `templates/systems/carbon-design/homepage.md` |
| Presentación | `templates/systems/carbon-design/presentation.md` |
| Dashboard SaaS | `templates/systems/carbon-design/dashboard-saas.md` |

Skill: **system-templates**

## When to Use

- B2B SaaS, fintech, healthcare, gov/public sector
- Data-dense dashboards, admin consoles, analytics
- WCAG AA/AAA requirements (Carbon components tested)
- When swiss-style + digital-minimalism overlay applies

## When Not to Use

- Shopify merchant admin → **polaris-design**
- Playful consumer mobile → **material-design**
- Creative portfolio with expressive art direction → system **none** + bauhaus

## Library

- `@carbon/react` (Carbon 11+)
- `@carbon/styles` for tokens
- Carbon Charts for data viz

## Core Principles

1. **Productive motion** — functional, not decorative
2. **Grid and rhythm** — 2× grid, consistent spacing scale
3. **Accessibility by default** — not bolted on
4. **Data first** — tables, structured lists, clear hierarchy

## Accessibility

- WCAG 2.1 AA minimum in component library
- Focus outlines built-in
- Do not disable focus styles
- Structured headings in complex pages

## Anti-Slop Risks

- Carbon + purple marketing hero grafted on product shell (keep brand/marketing separate)
- Gray 10 theme everywhere without hierarchy
- Tiles misused for dense tables (use DataTable)
- Inter fallback instead of IBM Plex Sans

See `references/summary.md`.

## DEFER Rules

- **frontend** — Carbon React implementation
- **patterns/dashboard-patterns** — layout composition

## Related Skills

- **styles/swiss-style** — common overlay
- **styles/digital-minimalism** — density calibration
- **accessibility-design** — AA/AAA validation
- **anti-slop** — enterprise cliché detection
