# Atelier Decision Flow

Source data: `vitals/data/design/decision-matrix.yaml`, `industries.yaml`, `palettes.yaml`, `styles.yaml`.

## Precedence (highest first)

```text
1. Ecosystem lock-in (Shopify, Atlassian, Microsoft, iOS, Android)
2. Industry match (signal scoring on brief + design-context)
3. Surface type (brand/landing vs product/dashboard)
4. A11y strict mode (excludes risky styles)
5. Default avoid list
```

## Ecosystem Lock-In

| Signals | System | Library |
|---------|--------|---------|
| shopify, polaris, merchant | polaris-design | Polaris Web Components |
| atlassian, jira, forge | atlassian-design | @atlaskit/* |
| microsoft, teams, fluent | fluent-design | @fluentui/react-components |
| ios, swiftui, uikit | apple-hig | SwiftUI / UIKit |
| android, compose, material you | material-design | Material 3 Compose |

When locked: **do not** suggest alternate systems without explicit user opt-out.

## Industry → Default Mapping (sample)

| Industry ID | System | Visual overlay | Pattern |
|-------------|--------|----------------|---------|
| saas-b2b | carbon-design | swiss + digital-minimalism | feature-rich-showcase |
| fintech | carbon-design | swiss + digital-minimalism | data-dense-dashboard |
| ecommerce | material-design | digital-minimalism | conversion-optimized |
| ai-product | material-design | digital-minimalism | interactive-demo |
| creative-agency | none | bauhaus-style | storytelling-driven |
| wellness-spa | — | digital-minimalism | hero-centric |

Full list: `vitals/data/design/industries.yaml`.

## A11y Strict

Triggered by: wcag, accessibility, gov, government, health, fintech, banking, HIPAA.

- Excludes: neumorphism-full, glassmorphism-full
- Requires: WCAG AA baseline

## Script Invocation Matrix

| Scenario | Flags |
|----------|-------|
| Quick ASCII box | default |
| Markdown for docs/PR | `--format markdown` |
| With saved context | `--context .agents/design-context.md` |
| Named product | `--product "Name"` |

## After Selection

```text
design-selector output
  → update design-context (system, style, avoid)
  → design-read (confirm V/M/D)
  → open system SKILL + style SKILL
  → pattern SKILL if surface matches
  → anti-slop before handoff
```
