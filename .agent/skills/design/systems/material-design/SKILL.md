---
name: material-design
description: "When designing for Android, Material 3 Expressive, Jetpack Compose, MUI, or Google ecosystem products. Also use when the user mentions 'Material Design,' 'Material You,' 'M3 Expressive,' 'MaterialExpressiveTheme,' 'MUI,' 'md3,' 'FAB,' 'dynamic color,' or Android native UI. Apply Material 3 Expressive principles — emphasized typography, increased shapes, tonal surfaces, MotionScheme.expressive. For iOS native, use apple-hig instead."
metadata:
  version: 1.0.0
---

# Material Design 3 Expressive

Google's Material Design 3 Expressive — emotional, token-driven, shape morph + emphasized type.

## Canonical templates

| Superficie | Spec |
|------------|------|
| Homepage producto + servicio | `templates/systems/material-design/homepage.md` |
| Presentación pitch / reporte | `templates/systems/material-design/presentation.md` |
| Dashboard SaaS | `templates/systems/material-design/dashboard-saas.md` |

Tokens: `tokens.css` (expressive color + shape scale)

Placeholders: `vitals/data/design/template-placeholders.yaml` · Skill: **system-templates**

## When to Use

- Android native (Jetpack Compose) — **ecosystem lock**
- Cross-platform web with MUI / Material Web Components
- E-commerce storefronts, education, developer tools, AI chat products
- When dynamic color / personalization is desired

## When Not to Use

- Shopify admin → **polaris-design**
- IBM enterprise data apps → **carbon-design**
- iOS-native → **apple-hig**
- Strict gov/fintech with minimal decoration → prefer **carbon-design** + swiss overlay

## Library

| Platform | Library |
|----------|---------|
| Android | Material 3 Compose (`androidx.compose.material3`) |
| React | MUI v6+ (`@mui/material`) |
| Web | Material Web Components (`@material/web`) |

## Core Principles (M3 Expressive)

1. **MaterialExpressiveTheme** — `expressiveLightColorScheme` or dynamic color from seed (not M2 purple default)
2. **Shape** — 10-step scale + `*Increased` + morph on key components (hero, FAB, buttons)
3. **Typography emphasized** — `displayLargeEmphasized`, `headlineLargeEmphasized`, `labelLargeEmphasized`
4. **Tonal surfaces** — `surface-container-*` tiers instead of arbitrary shadows
5. **Tertiary accents** — badges, FAB, CTA bands via tertiary-container
6. **Motion** — `MotionScheme.expressive()` · honor reduced motion

## Accessibility

- Touch targets ≥ 48dp
- Color roles (on-primary, on-surface) enforce contrast pairs
- Focus indicators on all interactives
- Do not rely on color alone for state

## Anti-Slop Risks

- Default MUI theme without token customization → generic SaaS
- Purple primary from MUI default palette
- Floating action button on desktop dashboards without justification
- Overusing elevated cards on dense data views

See `references/summary.md` for token mapping and component picks.

## DEFER Rules

- **frontend** — Compose/MUI implementation
- **brand-guardian** — brand color seed vs dynamic color policy

## Related Skills

- **styles/digital-minimalism** — common overlay
- **patterns/dashboard-patterns** — data layouts
- **design-tokens** — map M3 roles to CSS
- **anti-slop** — catch default purple MUI theme
