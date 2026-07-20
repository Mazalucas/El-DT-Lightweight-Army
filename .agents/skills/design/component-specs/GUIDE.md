---
name: component-specs
description: "When creating component specifications for designer-to-developer handoff — states, anatomy, tokens, behavior, a11y. Also use when the user mentions 'component spec,' 'design handoff,' 'Figma to dev,' 'component documentation,' or handoff-template."
metadata:
  version: 1.0.0
---

# Component Specs

Structured handoff docs so **frontend** implements once, correctly.

## Workflow

1. Read design-context, design-read, active system skill
2. Use `references/handoff-template.md` per component
3. Reference **design-tokens** by semantic name
4. Include all states and a11y requirements
5. Run **anti-slop** checklist on visual spec

## Spec Scope

| Include | Exclude |
|---------|---------|
| Anatomy diagram (text/ASCII) | Full production code |
| States: default, hover, focus, disabled, error, loading | Pixel-perfect Figma export |
| Token mapping | Business logic |
| Responsive behavior | API contracts → **arquitecto** |
| ARIA / keyboard | |

## Component Priority Order

1. Button, Input, Select (forms)
2. Card, Modal, Toast
3. Nav, Tabs, Table
4. Product-specific composites

## DEFER Rules

- **frontend** — all implementation
- **qa** — test cases from spec acceptance criteria
- **brand-guardian** — logo/icon usage in components

## Related Skills

- **design-tokens** — token references in spec
- **accessibility-design** — a11y section detail
- **ui-templates** — page-level context for components
- **component-variations** — alternative component explorations
