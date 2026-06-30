# DT overlay: document → design-context

> Capture visual system into `.agents/design-context.md` instead of standalone DESIGN.md.

## Goal

Extract colors, typography, spacing, radii, and component patterns from existing code → update **`.agents/design-context.md`**.

## Steps

1. Run context adapter: `node tools/atelier/generated/scripts/context.adapter.mjs`
2. Scan representative files: CSS variables, theme files, Tailwind config, primary layout component.
3. Update design-context sections:
   - **Tokens summary**
   - **System & style** (detected library: MUI, shadcn, Carbon, etc.)
   - **Anti-patterns** (what the codebase already avoids)
4. If product snapshot missing → merge from README or interview user briefly.
5. Preserve existing **Design dials** unless code clearly contradicts them.

## Output

Updated `.agents/design-context.md` with `updated:` date in frontmatter.

Optional export: user may request `DESIGN.md` copy for external tools — secondary, not canonical.

## Validation

- `./scripts/atelier-detect.sh` on touched UI paths
- Contrast pairs documented per `.cursor/skills/design/templates/shared/contrast-contract.md`
