---
name: fluent-design
description: "When designing for Microsoft 365, Teams, Outlook, Azure Portal, SharePoint, or Fluent UI React. Also use when the user mentions 'Fluent Design,' 'Fluent 2,' 'Microsoft UI,' '@fluentui/react-components,' or Windows app design. Apply Fluent 2 tokens and patterns. Ecosystem lock when Microsoft signals present."
metadata:
  version: 1.0.0
---

# Fluent Design (Fluent 2)

Microsoft's design system for productivity, enterprise, and Windows experiences.

## Canonical templates

| Superficie | Spec |
|------------|------|
| Homepage | `templates/systems/fluent-design/homepage.md` |
| Presentación | `templates/systems/fluent-design/presentation.md` |
| Dashboard SaaS | `templates/systems/fluent-design/dashboard-saas.md` |

Skill: **system-templates**

## When to Use

- Microsoft 365 add-ins, Teams apps, SharePoint — **ecosystem lock**
- Azure Portal-style admin tools
- Cross-platform admin with `@fluentui/react-components`

## When Not to Use

- Shopify → **polaris-design**
- Atlassian → **atlassian-design**
- Consumer mobile-first outside Microsoft → evaluate material-design or custom

## Library

- `@fluentui/react-components` (Fluent 2, web)
- `@fluentui/react-native` (mobile)
- WinUI 3 (Windows native)

## Core Principles

1. **Natural on every platform** — adaptive, not pixel-copy Windows on mobile
2. **Built for focus** — calm density for long sessions
3. **One system, flexible** — shared tokens across M365 shell

## Accessibility

- High contrast themes supported
- Keyboard navigation first-class
- Narrator / screen reader tested patterns in Fluent components
- Focus visible on all controls

## Anti-Slop Risks

- Legacy `@fluentui/react` (v8) mixed with v9+ without migration plan
- Acrylic blur overuse on web without fallback
- Default Fluent blue without tenant branding where allowed

See `references/summary.md`.

## DEFER Rules

- **frontend** — Fluent UI implementation
- **patterns/dashboard-patterns** — Azure-style dense layouts

## Related Skills

- **styles/digital-minimalism** — typical overlay
- **accessibility-design** — keyboard-first patterns
- **design-tokens** — Fluent theme customization
