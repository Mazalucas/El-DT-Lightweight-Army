# Material Design 3 Expressive — Summary

> Evolución de M3: `MaterialExpressiveTheme`, shape morph, typography emphasized, motion spring, tertiary accents.

## Entry point (Compose)

```kotlin
MaterialExpressiveTheme(
    colorScheme = expressiveLightColorScheme(), // or dynamicColor on Android 12+
    motionScheme = MotionScheme.expressive(),
    shapes = Shapes(/* include *Increased variants */),
    typography = Typography(/* *Emphasized styles */)
)
```

## Token Roles (expressive)

| Role | Use |
|------|-----|
| primary / on-primary | Main filled actions |
| secondary-container | Tonal buttons, nav chips active |
| tertiary / tertiary-container | FAB, badges, accent KPIs, CTA bands |
| surface-container-* (5 tiers) | Elevation via tone — **not** box-shadow |
| outline / outline-variant | Borders, dividers |

## Shape scale (mandatory)

| Token | dp | Atelier CSS var |
|-------|-----|-----------------|
| extra-small | 4 | `--ds-shape-extra-small` |
| small | 8 | `--ds-shape-small` |
| medium | 12 | `--ds-shape-medium` |
| large | 16 | `--ds-shape-large` |
| extra-large | 28 | `--ds-shape-extra-large` |
| large-increased | 24 | `--ds-shape-large-increased` |
| extra-large-increased | 32 | `--ds-shape-extra-large-increased` |
| full | pill | `--ds-shape-full` |

Use **increased** shapes on hero visuals, feature cards, metrics, FAB.

## Typography emphasized

| Style | Use in templates |
|-------|------------------|
| displayLargeEmphasized | Hero headline |
| headlineLargeEmphasized | Section titles, dashboard page title |
| titleLargeEmphasized | Card titles, panel headers |
| labelLargeEmphasized | Buttons, nav chips |

Font: **Roboto Flex** (variable) — not Inter.

## Components (templates)

- **Top app bar** + nav chips (full shape)
- **Filled + Tonal + Outlined** buttons (never only one style)
- **Navigation rail** on dashboard (not generic sidebar)
- **FAB** tertiary-container — mobile primary action
- **Search** pill on surface-container-highest

## Motion

- `MotionScheme.expressive()` spring specs
- Shape morph on hero/FAB hover (CSS: `--ds-motion-spring`)
- Honor `prefers-reduced-motion`

## Slop Avoidance

```markdown
❌ MUI default purple #6750A4 + Inter + box-shadow cards
❌ Generic Bootstrap dashboard sidebar
✅ expressiveLightColorScheme seed · Roboto Flex · tonal surfaces · nav rail
```

## Links

- [Material 3 in Compose (Expressive)](https://developer.android.com/develop/ui/compose/designsystems/material3)
- [MaterialExpressiveTheme](https://developer.android.com/reference/kotlin/androidx/compose/material3/MaterialExpressiveTheme)
- [m3.material.io](https://m3.material.io/)
