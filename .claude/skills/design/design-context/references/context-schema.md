# design-context.md Schema

Canonical path: `.agents/design-context.md`

```yaml
# Frontmatter (optional YAML block at top)
version: 1
updated: YYYY-MM-DD
product: Project Name
```

## 1. Product Snapshot

| Field | Description |
|-------|-------------|
| One-liner | What the product does in one sentence |
| Category | Shelf (e.g. B2B SaaS, fintech dashboard) |
| Primary users | Roles and jobs-to-be-done |
| Source | Link to `.agents/product-marketing.md` if imported |

## 2. Surfaces

```markdown
- **Primary:** product | landing | deck | marketing
- **In scope now:** [current task surface]
- **Out of scope:** [e.g. mobile native v1]
```

## 3. Design Dials (V / M / D)

Scale 1–5. Document rationale in one line each.

| Dial | 1 | 5 |
|------|---|---|
| **Visual (V)** | Sparse, lots of whitespace | Dense, information-rich |
| **Motion (M)** | Static, instant | Expressive, choreographed |
| **Depth (D)** | Flat, single plane | Layered, shadows/materials |

Example:

```markdown
- V: 3 — balanced dashboard density
- M: 2 — subtle transitions only; respect reduced-motion
- D: 2 — flat cards, 1px borders, no glass
```

## 4. System & Style

```markdown
- **Design system:** carbon-design | material-design | … | none
- **Visual overlay:** swiss-style + digital-minimalism
- **Ecosystem lock:** shopify | atlassian | none
- **Library:** @carbon/react | Polaris | TBD
```

## 5. Tokens Summary

```markdown
- **Primary:** #0f62fe
- **Neutral:** slate scale, no pure #000
- **Typography:** IBM Plex Sans / system-ui
- **Radius:** 4px (buttons), 8px (cards)
- **Spacing unit:** 4px grid
```

## 6. Anti-Patterns (Required)

Bulleted, testable exclusions:

```markdown
- No purple-to-blue hero gradients
- No Inter without documented brand reason
- No glassmorphism on data tables
- No emoji icons — SVG only
- No nested cards
- No bounce easing
```

## 7. Accessibility Baseline

```markdown
- Target: WCAG 2.2 AA
- Contrast: 4.5:1 body, 3:1 large text
- Focus: visible ring on all interactives
- Motion: prefers-reduced-motion honored
```

## 8. Brand Manual (required for decks)

Complete before any presentation work. See `references/brand-manual-checklist.md`.

```markdown
- **Logo:** path or wordmark description
- **Primary / accent / background:** hex values
- **Typography:** display + body (+ font URLs)
- **Tone:** formal | expressive | technical
- **Restrictions:** prohibited colors, photo policy, legal disclaimers
- **Source:** PDF manual | interview date
```

## 9. Open Decisions

Track unresolved choices for design-selector or stakeholder input.
