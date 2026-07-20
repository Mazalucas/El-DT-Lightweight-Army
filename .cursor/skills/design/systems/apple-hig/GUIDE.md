---
name: apple-hig
description: "When designing for iOS, iPadOS, macOS, visionOS, SwiftUI, or UIKit. Also use when the user mentions 'Human Interface Guidelines,' 'HIG,' 'SF Symbols,' 'SwiftUI,' 'native iOS,' or Apple platform apps. Apply Apple HIG layout, typography, and materials. For Android, use material-design."
metadata:
  version: 1.0.0
---

# Apple Human Interface Guidelines

Apple platform design — clarity, deference, depth (native meaning, not AI depth dial).

## Canonical templates

| Superficie | Spec |
|------------|------|
| Homepage | `templates/systems/apple-hig/homepage.md` |
| Presentación | `templates/systems/apple-hig/presentation.md` |
| Dashboard SaaS | `templates/systems/apple-hig/dashboard-saas.md` |

Skill: **system-templates**

## When to Use

- iOS / iPadOS / macOS / visionOS native — **ecosystem lock**
- Apple-ecosystem web apps mimicking Settings/Music aesthetic (careful: prefer native)
- Products where SF Symbols and system typography are expected

## When Not to Use

- Cross-platform web SaaS → Material or Carbon unless iOS-only SKU
- Shopify / Microsoft / Atlassian embedded apps → respective system skills
- Heavy data-grid enterprise → **carbon-design** often fits web better

## Library

- SwiftUI (preferred new work)
- UIKit (legacy)
- SF Symbols for icons
- SF Pro / New York system fonts

## Core Principles

1. **Clarity** — legible text, precise icons, focused functionality
2. **Deference** — UI supports content; minimal chrome
3. **Depth** — layers and motion communicate hierarchy (vibrancy, materials)

## Accessibility

- Dynamic Type required — layouts must reflow
- VoiceOver labels on all controls
- Reduce Transparency / Increase Contrast settings
- Minimum 44pt touch targets

## Anti-Slop Risks

- Fake iOS glass on web without vibrancy fallback
- Non-SF icon mix on native apps
- Custom tab bars that break safe area
- visionOS glass everywhere without spatial purpose

See `references/summary.md`.

## DEFER Rules

- **frontend** — SwiftUI/UIKit code
- **styles/glassmorphism** — partial overlap; HIG materials ≠ web glass slop

## Related Skills

- **styles/glassmorphism** — controlled on visionOS/iOS materials
- **responsive-layout** — size classes, Split View
- **motion-design** — spring animations, reduced motion
