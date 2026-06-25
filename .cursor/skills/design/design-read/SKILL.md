---
name: design-read
description: "When starting a design session and the user wants a quick taste check or visual direction sanity pass. Also use when the user mentions 'design read,' 'V/M/D dials,' 'visual density,' 'motion dial,' 'depth dial,' 'taste check,' or 'one-liner design direction.' Produces a one-line design intent plus three calibrated dials (Visual, Motion, Depth) inspired by taste-skill. Use before wireframes, mockups, or component specs."
metadata:
  version: 1.0.0
---

# Design Read

A 60-second alignment ritual: one sentence of design intent + three dials. Prevents drift mid-session.

## When to Run

- Start of any ui-designer session
- After design-selector changes system/style
- Before presentation-design or landing-patterns work
- When user says "make it look better" without criteria

## Workflow

### Step 1: Load Context

Read `.agents/design-context.md` if present. Note product, surface, anti-patterns.

### Step 2: Produce Design Read

Output exactly this structure:

```markdown
## Design Read

**One-liner:** [Single sentence: who, surface, feeling, constraint]

| Dial | Value | Rationale |
|------|-------|-----------|
| **V** (Visual density) | 1–5 | … |
| **M** (Motion) | 1–5 | … |
| **D** (Depth) | 1–5 | … |

**Guardrails:** [2–3 bullets from anti-patterns or avoid list]
```

### Dial Calibration Guide

| Dial | 1 | 3 | 5 |
|------|---|---|---|
| **V** | Editorial whitespace, few elements per view | Standard SaaS density | Terminal-like, tables everywhere |
| **M** | No animation; instant state changes | Hover/focus transitions 150–200ms | Page transitions, staggered reveals |
| **D** | Flat color fields, hairline borders | Subtle elevation (1–2 shadow steps) | Glass, layered modals, parallax |

**Defaults by surface:**

- Landing (brand): V 2–3, M 2–3, D 2–4
- Dashboard (product): V 3–4, M 1–2, D 1–2
- Fintech/gov: V 3–4, M 1, D 1–2, a11y AA

### Step 3: Confirm or Adjust

Ask: "Do these dials match your intent?" One round of adjustment max unless user pivots.

## Protocol

- **No cómplice:** If user wants D=5 glass on fintech dashboard, cite a11y and slop risk; propose D=2 alternative.
- Dials must **not** all be 3 — that's the "AI average"; differentiate.

## Anti-Slop Notes

- High D + high glass = slop cluster; cap glass per design-context.
- High M + bounce easing = dated; prefer ease-out or spring with reduced-motion fallback.

## DEFER Rules

- **frontend** — implementing animations or layout code
- **design-context** — if no file exists and session is multi-day, persist dials there
- **motion-design** — detailed animation specs when M ≥ 3

## Related Skills

- **design-context** — stores canonical dials
- **design-selector** — informs dial defaults
- **anti-slop** — validates output against guardrails
- **motion-design** — when M ≥ 3
