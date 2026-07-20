---
name: anti-slop
description: "When reviewing UI for generic AI-generated design patterns or before design handoff. Also use when the user mentions 'anti-slop,' 'AI slop,' 'purple gradient,' 'looks like every SaaS,' 'atelier-detect,' 'dt-design-detect,' 'design quality check,' or 'Impeccable-style detect.' Runs `./scripts/atelier-detect.sh` (Impeccable CLI) on code paths and applies guardrails from references/checklist.md."
metadata:
  version: 1.0.0
---

# Anti-Slop Guardrails

Deterministic + judgment-based review to catch generic AI UI before ship. Powered by Impeccable CLI via `scripts/atelier-detect.sh` (44+ rules).

## Workflow

### Step 1: Context

Read `.agents/design-context.md` anti-patterns. Merge with default avoid list from design-selector.

### Step 2: Run Detector (when code exists)

```bash
./scripts/atelier-detect.sh src/
./scripts/atelier-detect.sh path/to/component.tsx --json
```

Parse `[SLOP###]` and `[A11Y###]` IDs. Map to fixes in `references/checklist.md`.

### Step 3: Visual/Mock Review (when no code)

Walk `references/checklist.md` manually for wireframes, Figma descriptions, or generated HTML.

### Step 4: Report

```markdown
## Anti-Slop Report

**Scan target:** [path or "mockup review"]
**Issues:** N critical, M warnings

| ID | Location | Fix |
|----|----------|-----|
| SLOP001 | hero.css:42 | Replace violet gradient with brand primary solid |

**Passed:** [what looks intentional, not generic]
**Verdict:** ship | fix-first | escalate (brand-guardian)
```

## Rule IDs (Script)

| ID | Issue |
|----|-------|
| SLOP001 | Purple/violet AI gradient |
| SLOP002 | Inter without justification |
| SLOP003 | Arial primary font |
| SLOP004 | backdrop-filter blur (check 30% glass quota) |
| SLOP005 | Neumorphism inset shadows |
| SLOP006 | Bounce/elastic easing |
| SLOP007 | Gray text on colored bg |
| SLOP008 | Pure black #000 |
| SLOP009 | Emoji as icons |
| SLOP010 | Nested cards |
| SLOP011 | Side-tab accent border |
| SLOP012 | Heavy dark glow |
| SLOP013 | Three-column feature cliché |
| A11Y001 | Click without button/cursor |

## Pre-Delivery Checklist (always)

- [ ] Contrast 4.5:1 minimum (body text)
- [ ] Focus states visible
- [ ] `prefers-reduced-motion` respected
- [ ] `cursor-pointer` on clickables
- [ ] Responsive: 375, 768, 1024, 1440
- [ ] SVG icons, not emoji
- [ ] No unjustified purple gradients

## Protocol

- **Gate duro:** Do not hand off to frontend with unresolved SLOP001–SLOP003 unless user documents brand exception in design-context.

## DEFER Rules

- **frontend** — apply CSS/TSX fixes
- **brand-guardian** — when slop is actually on-brand (rare; needs written exception)
- **accessibility-design** — deep WCAG audit beyond detect heuristics

## Related Skills

- **design-read** — preventive dials before slop accumulates
- **design-context** — anti-patterns source of truth
- **accessibility-design** — A11Y001 and contrast failures
- **component-specs** — embed checklist in handoff
