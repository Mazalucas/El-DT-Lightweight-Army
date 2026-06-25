---
name: digital-minimalism
description: "When designing clean, minimal product UI — productivity SaaS, writing tools, MVPs. Also use when the user mentions 'minimal SaaS,' 'clean UI,' 'simple dashboard,' or design-selector recommends digital-minimalism. High slop risk — requires explicit anti-patterns in design-context."
metadata:
  version: 1.0.0
---

# Digital Minimalism

Restrained UI focused on content and task completion — the default AI aesthetic; use deliberately.

## Canonical templates

| File | Path |
|------|------|
| Tokens | `design/templates/styles/digital-minimalism/tokens.css` |
| Landing | `design/templates/styles/digital-minimalism/landing.md` |
| Product shell | `design/templates/styles/digital-minimalism/product-shell.md` |
| Auth | `design/templates/styles/digital-minimalism/auth.md` |

## Best For

- Productivity SaaS, writing tools, MVPs
- Overlay on Material, Carbon, Polaris, Fluent
- When speed-to-ship beats expressive brand

## Avoid

- As only direction with no anti-patterns (becomes slop)
- Wellness/spa needing warmth → add soft palette
- Creative portfolio differentiation

## Principles

See `references/principles.md`.

## Accessibility

- Excellent when contrast and focus maintained
- Fails when gray-on-gray "subtle" text

## Anti-Slop Risks (**high**)

- Inter + white + gray borders + purple CTA = default AI product
- Empty states with no illustration system
- Identical card grids
- **Require** design-context exclusions and one distinctive choice (type, accent, layout)

## DEFER Rules

- **frontend** — Tailwind/shadcn implementation
- **design-context** — must document anti-patterns before applying

## Related Skills

- **anti-slop** — mandatory companion
- **design-read** — differentiate dials from all-3 defaults
- **design-tokens** — custom tokens prevent generic look
