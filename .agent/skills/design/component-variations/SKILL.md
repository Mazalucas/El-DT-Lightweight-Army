---
name: component-variations
description: "When exploring alternative component implementations or browsing UI component libraries via optional MCP. Also use when the user mentions 'component variations,' '21st.dev,' 'UI component alternatives,' 'shadcn variants,' or wants options before committing to a component approach. Optional MCP — no API keys required for spec-only workflow."
metadata:
  version: 1.0.0
---

# Component Variations

Explore component alternatives before locking **component-specs**.

## Workflow (no MCP)

1. Define component need from template or spec draft
2. List 2–3 approaches aligned with design system:
   - System native (Carbon Button)
   - Headless + tokens (custom)
   - Composition pattern (Button + Icon)
3. Compare: a11y, bundle size, customization, slop risk
4. Recommend one; document in handoff template

## Workflow (optional 21st.dev MCP)

If MCP configured, see `references/21st-dev-mcp.md`.

- Browse reference implementations for inspiration
- **Do not** copy purple-gradient defaults wholesale
- Extract patterns; re-theme with **design-tokens**

## Comparison Matrix

| Criterion | Weight |
|-----------|--------|
| Matches design system | High |
| a11y out of box | High |
| Anti-slop (not generic) | Medium |
| Dev familiarity | Medium |
| Customization cost | Context |

## Anti-Slop

- shadcn/ui defaults + zero token customization = slop
- Always re-skin with project tokens

## DEFER Rules

- **frontend** — install and implement chosen variant
- **component-specs** — finalize spec after selection

## Related Skills

- **component-specs** — output destination
- **design-tokens** — re-theming variations
- **anti-slop** — vet imported patterns
- **systems/** — prefer system-native first
