---
name: design-selector
description: "When the user needs a design system and visual style recommendation for a product or feature. Also use when the user mentions 'Atelier,' 'which design system,' 'design recommendation,' 'dt-design-select,' 'pick Material vs Carbon,' 'Shopify Polaris,' or describes a brief like 'fintech dashboard B2B.' Runs `ruby scripts/dt-design-select.rb` — do not manually guess when the script is available."
metadata:
  version: 1.0.0
---

# Design Selector

You recommend design system + visual overlay + avoid list using the Atelier decision engine. **Always prefer the script** over loading full YAML into context.

## Workflow

### Step 1: Context

1. Read `.agents/design-context.md` if it exists.
2. Read `.agents/product-marketing.md` for product name/category.
3. Collect brief: industry, surface (landing vs product), ecosystem (Shopify, Jira, etc.), a11y requirements.

### Step 2: Run Selector

```bash
ruby scripts/dt-design-select.rb "BRIEF" --product "Product Name" --format markdown
```

With context file:

```bash
ruby scripts/dt-design-select.rb "fintech dashboard B2B" \
  --product "Acme Pay" \
  --context .agents/design-context.md \
  --format markdown
```

**Do not** paste entire `vitals/data/design/*.yaml` into chat — the script reads them.

### Step 3: Interpret Output

Map results to skills:

| Output field | Skill to open next |
|--------------|-------------------|
| design_system | `systems/{name}/GUIDE.md` |
| visual_overlay | `styles/{name}/GUIDE.md` |
| TEMPLATE * | `style-templates` → `design/templates/styles/{name}/` |
| pattern | `patterns/{name}/GUIDE.md` if exists |
| avoid | Add to design-context anti-patterns |

See `references/decision-flow.md` for precedence rules (ecosystem lock > industry > defaults).

### Step 4: Handoff

End with explicit next steps:

1. Update design-context with recommendation
2. Load **style-templates** (paths `TEMPLATE` from script output)
3. Run design-read (V/M/D)
4. Open matched system + style skills
5. ui-designer → frontend for implementation

## Protocol

- **Ecosystem lock wins:** Shopify → polaris-design; never override without user confirmation.
- **A11y strict:** When WCAG/gov/health/fintech signals, exclude full glass/neumorphism per matrix.

## DEFER Rules

- **frontend** — library install, component code
- **brand-guardian** — brand palette override of industry defaults
- **design-context** — if no context file and brief is vague, create context first

## Anti-Slop Notes

- Script `avoid` list is mandatory unless user explicitly overrides with rationale in design-context.
- If recommendation includes glassmorphism + a11y strict, flag conflict — script should already exclude; verify.

## Related Skills

- **design-context** — persist recommendation
- **style-templates** — tokens + layouts canónicos
- **design-read** — calibrate dials after selection
- **anti-slop** — pre-delivery scan
- All **systems/** and **styles/** skills — deep application
