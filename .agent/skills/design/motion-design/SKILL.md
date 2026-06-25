---
name: motion-design
description: "When specifying UI animation — duration, easing, transitions, micro-interactions, page motion. Also use when the user mentions 'animation,' 'motion,' 'transitions,' 'micro-interaction,' 'easing,' or design-read M dial ≥2. Always include prefers-reduced-motion."
metadata:
  version: 1.0.0
---

# Motion Design

Purposeful motion — calibrate with design-read **M dial**.

## M Dial → Motion Budget

| M | Guidance |
|---|----------|
| 1 | No animation; instant state change only |
| 2 | Hover/focus 150–200ms; modal fade |
| 3 | Page section enter; stagger lists max 50ms between items |
| 4 | Choreographed onboarding; shared element transitions |
| 5 | Expressive marketing only — still honor reduced-motion |

## Duration Tokens

From **design-tokens**:

- Fast: 150ms — hover, focus, toggle
- Normal: 200ms — modal, dropdown
- Slow: 300ms — page transition (product: avoid)

## Easing

| Token | Use |
|-------|-----|
| `--ease-out` | Entering elements |
| `--ease-in-out` | State toggle |
| **Avoid** | bounce, elastic (SLOP006) |

## What to Animate

- Opacity + transform (translateY 8px max) — GPU-friendly
- Avoid animating width/height (layout thrash)
- Skeleton loaders: subtle pulse, not flashy

## Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

Or use token override in design-tokens template.

## Pattern-Specific

| Surface | Motion |
|---------|--------|
| Dashboard | Minimal — data updates fade |
| Landing | Hero optional fade-up (M≥3) |
| Auth | Error shake discouraged — use color |
| Modal | Backdrop fade 200ms + panel scale 0.98→1 |

## Anti-Slop

- Bounce on buttons
- Infinite attention-grabbing pulses
- Parallax on product UI

## DEFER Rules

- **frontend** — CSS/Framer Motion implementation

## Related Skills

- **design-read** — M dial source
- **design-tokens** — duration/easing vars
- **accessibility-design** — reduced motion
- **anti-slop** — SLOP006 bounce
