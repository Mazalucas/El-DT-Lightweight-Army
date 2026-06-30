# 21st.dev MCP (Optional)

Optional integration for browsing UI component inspiration. **Not required** for Atelier workflow.

## When to Use

- Early exploration: "show me dashboard card variants"
- Compare layout patterns before writing component-specs
- User already has 21st.dev MCP enabled in Cursor

## When Not to Use

- Final implementation source without re-theme
- Projects with strict design system lock (Shopify, Atlassian)
- When no MCP available — use system docs instead

## Setup (user-side)

1. User enables 21st.dev MCP in Cursor settings if desired
2. No API keys stored in repo
3. Agent queries MCP for component references only

## Safe Workflow

```text
1. Query MCP for component category
2. Screenshot/description review — flag slop (gradients, Inter)
3. Map chosen pattern to design system component OR custom spec
4. Apply design-tokens — never ship default MCP styling
5. Document in component-specs handoff
```

## Fallback (no MCP)

- System storybooks: Carbon, Fluent, MUI, Polaris docs
- **ui-templates** scaffolds
- **component-specs** from scratch

## DEFER

- **frontend** — code from any MCP reference
