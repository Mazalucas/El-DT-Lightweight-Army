---
name: design-tokens
description: "When defining or exporting design tokens — colors, typography, spacing, radius, shadows — as CSS variables or theme config. Also use when the user mentions 'design tokens,' 'CSS variables,' 'theme file,' 'design system tokens,' or needs tokens-template.css for handoff to frontend."
metadata:
  version: 1.0.0
---

# Design Tokens

Semantic token layer bridging design-context and frontend implementation.

## Workflow

1. Read `.agents/design-context.md` tokens summary + system skill (Carbon/Material/etc.)
2. Start from `references/tokens-template.css`
3. Map **semantic** names (`--color-text-primary`) not raw hex in components
4. Document light/dark if applicable
5. Output tokens file path recommendation (e.g. `src/styles/tokens.css`)

## Token Categories

| Category | Examples |
|----------|----------|
| Color | background, surface, text, border, accent, semantic |
| Typography | font-family, size scale, weight, line-height |
| Space | 4px grid multiples |
| Radius | sm, md, lg |
| Shadow | elevation steps (minimal on flat systems) |
| Motion | duration, easing (link **motion-design**) |

## System Alignment

| System | Token source |
|--------|--------------|
| Carbon | `@carbon/styles` themes |
| Material | M3 roles |
| Fluent | Fluent theme JSON |
| Custom | tokens-template.css |

## Anti-Slop

- No `--font-sans: Inter` without comment referencing design-context exception
- No `--color-primary: #6366f1` (default indigo slop)
- Tint neutrals: `#0f172a` not `#000`

## DEFER Rules

- **frontend** — integrate tokens in Tailwind/CSS-in-JS
- **brand-guardian** — official brand hex values

## Related Skills

- **design-context** — source values
- **component-specs** — reference tokens in handoff
- **systems/** — system-specific token names
- **anti-slop** — SLOP002 Inter, SLOP008 black
