---
name: accessibility-design
description: "When designing for accessibility — WCAG contrast, focus states, keyboard flows, screen reader labels, inclusive patterns. Also use when the user mentions 'a11y,' 'WCAG,' 'accessibility,' 'contrast ratio,' 'focus ring,' 'screen reader,' or a11y strict mode in design-context."
metadata:
  version: 1.0.0
---

# Accessibility Design

Inclusive design requirements — not optional polish.

## Baseline (default)

- **WCAG 2.2 AA** for all product UI
- **AAA** when design-context or industry requires (gov, health)

## Core Requirements

### Color & Contrast

| Content | Ratio |
|---------|-------|
| Body text | 4.5:1 |
| Large text (18px+ bold / 24px+) | 3:1 |
| UI components & graphics | 3:1 |
| Focus indicator | 3:1 against adjacent colors |

- Never gray-400 text on white for body
- Status: icon + text, not color alone

### Focus

- Visible focus ring on all interactives
- Do not `outline: none` without replacement
- Focus order matches visual order (mostly)

### Keyboard

- All actions reachable without mouse
- Modals trap focus; Esc closes
- Skip link on app shells

### Motion

- Honor `prefers-reduced-motion`
- No autoplay without pause; no seizure triggers

### Forms

- Visible labels (not placeholder-only)
- Errors: inline + summary for multi-error
- `autocomplete` attributes on auth fields

### Touch

- Targets ≥ 44×44px (mobile)
- Spacing between adjacent targets

## System Notes

| System | Built-in |
|--------|----------|
| Carbon | Strong defaults — don't override away |
| Material | Role pairs enforced |
| Polaris | Form components labeled |
| Custom | You own everything |

## Anti-Slop vs A11y

- Glass text (SLOP004) often fails contrast
- Neumorphism buttons fail contrast
- Gray on gradient buttons (SLOP007)

Run **anti-slop** + manual contrast check.

## DEFER Rules

- **frontend** — ARIA implementation, focus trap code
- **qa** — automated a11y testing (axe, pa11y)

## Related Skills

- **anti-slop** — A11Y001 click handlers
- **design-context** — a11y baseline level
- **patterns/auth-flows** — form a11y
- **motion-design** — reduced motion
