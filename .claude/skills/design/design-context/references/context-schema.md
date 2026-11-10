# design-context.md Schema

Canonical path: `.agents/design-context.md` — the only path; local, never versioned.
Criterio (what travels in git, what is local, who writes it): `vitals/specs/design-skills-protocol.md` § **Contexto de diseño — criterio único**. This file defines only the fields.

## 0. Frontmatter (required)

```yaml
---
version: 1
updated: YYYY-MM-DD
product: Project Name
register: product   # product (app, dashboard, tool) | brand (marketing, landing, portfolio)
---
```

`register` selects the Atelier mode (product → Operate, brand → Persuade). See `.cursor/skills/atelier/SKILL.md` § Register references.

## Sections

| # | Section | Required |
|---|---------|----------|
| 1 | Product Snapshot | Yes |
| 2 | Surfaces | Yes |
| 3 | Design Dials (V / M / D) | Yes |
| 4 | System & Style | Yes (`TBD` allowed) |
| 5 | Tokens Summary | Yes (`TBD` allowed) |
| 6 | Anti-patterns | Yes — never empty |
| 7 | Accessibility Baseline | Yes |
| 8 | Brand Manual | Only before deck/presentation work |
| 9 | Open Decisions | Optional |

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

**V** = visual density · **M** = motion · **D** = depth. Scale 1–5, one-line rationale each. Calibration: skill `design-read`.

| Dial | 1 | 5 |
|------|---|---|
| **V — visual density** | Sparse, lots of whitespace | Dense, information-rich |
| **M — motion** | Static, instant | Expressive, choreographed |
| **D — depth** | Flat, single plane | Layered, shadows/materials |

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

## 6. Anti-patterns (required)

Section title is always `Anti-patterns`. Bulleted, testable exclusions; skill `anti-slop` reads this list:

```markdown
- No purple-to-blue hero gradients
- No Inter without documented brand reason
- No glassmorphism on data tables
- No emoji icons — SVG only
- No nested cards
- No bounce easing
```

Approved brand exceptions go here too, each with its reason.

## 7. Accessibility Baseline

```markdown
- Target: WCAG 2.2 AA
- Contrast: 4.5:1 body, 3:1 large text
- Focus: visible ring on all interactives
- Motion: prefers-reduced-motion honored
```

## 8. Brand Manual (required before decks)

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
