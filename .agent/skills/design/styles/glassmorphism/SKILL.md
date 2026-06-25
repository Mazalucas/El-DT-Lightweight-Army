---
name: glassmorphism
description: "When applying controlled glassmorphism — backdrop blur, translucency, spatial UI chrome. Also use for media apps, visionOS-adjacent web, modal overlays, or glassmorphism overlay from design-selector. Max ~30% of UI; requires opaque fallback. Very high slop risk."
metadata:
  version: 1.0.0
---

# Glassmorphism (Controlled)

Translucent surfaces with backdrop blur — material chrome, not entire app.

## Canonical templates

| File | Path |
|------|------|
| Tokens | `design/templates/styles/glassmorphism/tokens.css` |
| Landing | `design/templates/styles/glassmorphism/landing.md` |
| Product shell | `design/templates/styles/glassmorphism/product-shell.md` |
| Nav overlay | `design/templates/styles/glassmorphism/nav-overlay.md` |

## Best For

- Media apps, music/video players
- Modal overlays, floating toolbars
- iOS/visionOS-adjacent chrome (with **apple-hig**)
- Native OS-style panels

## Avoid

- Fintech, healthcare, gov (a11y strict excludes full glass)
- Data-dense dashboards (readability)
- All cards on landing page (SLOP004 cluster)

## Principles

See `references/principles.md`.

## Accessibility

- Text on blur fails contrast unpredictably
- Provide solid `background` fallback when `backdrop-filter` unsupported
- Respect Reduce Transparency (Apple) — opaque alternate

## Anti-Slop Risks (**very high**)

- Frosted card on frosted hero on gradient mesh
- Purple glass bubbles on AI chat (ai-native-ui cliché)
- Glass nav + glass sidebar + glass cards >30%

## DEFER Rules

- **frontend** — backdrop-filter CSS with fallbacks
- **systems/apple-hig** — native materials vs web imitation

## Related Skills

- **anti-slop** — SLOP004 glass quota
- **accessibility-design** — contrast on translucent layers
- **motion-design** — subtle blur transitions only
