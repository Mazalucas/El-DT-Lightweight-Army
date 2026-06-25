---
name: ui-templates
description: "When the user needs starter UI layout scaffolds or wireframe structures for auth, dashboard, or common app shells. Also use when the user mentions 'UI template,' 'layout scaffold,' 'starter layout,' 'wireframe structure,' or references auth-minimal / dashboard-analytics templates."
metadata:
  version: 1.0.0
---

# UI Templates

Opinionated layout scaffolds — structure and hierarchy, not final visual polish.

**Estética:** usar **style-templates** (`design/templates/styles/{style}/`) después de elegir estilo visual.

## Available Templates

| Template | Path | Use |
|----------|------|-----|
| Auth minimal | `references/templates/auth-minimal.md` | Login/signup card |
| Dashboard analytics | `references/templates/dashboard-analytics.md` | KPI + chart + table |

## Workflow

1. Read design-context + design-selector recommendation
2. Load **style-templates** for tokens + visual rules
3. Pick layout template matching surface
3. Adapt grid to chosen design system components
4. Output annotated wireframe spec (ASCII or structured markdown)
5. Hand off to **component-specs** or **frontend**

## Customization Rules

- Swap component names to match system (Carbon Button vs MUI Button)
- Preserve information hierarchy — don't add marketing sections to auth template
- Note breakpoints from **responsive-layout**

## Anti-Slop

- Templates intentionally avoid gradient heroes and 3-col features
- Do not "decorate" template into slop — apply style skills separately

## DEFER Rules

- **frontend** — code generation from template
- **component-variations** — explore component alternatives via MCP

## Related Skills

- **patterns/auth-flows** — auth UX rules
- **patterns/dashboard-patterns** — dashboard behavior
- **component-specs** — detailed handoff from template
- **design-tokens** — theme the scaffold
