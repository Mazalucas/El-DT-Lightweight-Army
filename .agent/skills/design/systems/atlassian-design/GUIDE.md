---
name: atlassian-design
description: "When designing Atlassian apps, Jira/Confluence plugins, Forge apps, or Atlaskit UI. Also use when the user mentions 'Atlassian Design System,' 'Atlaskit,' 'Forge,' 'Jira app,' or 'ADG.' Ecosystem lock for Atlassian marketplace products."
metadata:
  version: 1.0.0
---

# Atlassian Design System

Atlassian's design language for Jira, Confluence, and ecosystem apps.

## Canonical templates

| Superficie | Spec |
|------------|------|
| Homepage | `templates/systems/atlassian-design/homepage.md` |
| Presentación | `templates/systems/atlassian-design/presentation.md` |
| Dashboard SaaS | `templates/systems/atlassian-design/dashboard-saas.md` |

Skill: **system-templates**

## When to Use

- Forge / Connect apps in Jira, Confluence, Bitbucket — **ecosystem lock**
- Admin configuration inside Atlassian products
- Rovo/agent UI following ADS patterns

## When Not to Use

- Standalone SaaS outside Atlassian shell
- Shopify / Microsoft products
- Public marketing site (different art direction allowed)

## Library

- `@atlaskit/*` packages (button, modal, page, etc.)
- ADS tokens and typography
- Forge UI extensions where applicable

## Core Principles

1. **Bold, simple, optimistic** — but subdued inside dense issue views
2. **Discoverable** — progressive disclosure in complex workflows
3. **Inclusive** — ADS accessibility guidelines
4. **Familiarity** — match host product (Jira vs Confluence density)

## Accessibility

- ADS components include keyboard and ARIA patterns
- Color tokens designed for contrast in light/dark (where supported)
- Do not strip focus rings from Atlaskit overrides

## Anti-Slop Risks

- Custom CSS fighting Atlaskit spacing
- Rebuilding issue navigator patterns from scratch
- Marketing-style heroes inside Jira panel (wrong surface)
- Ignoring dark mode in host product context

See `references/summary.md`.

## DEFER Rules

- **frontend** — Atlaskit / Forge implementation
- **patterns/dashboard-patterns** — Jira-style dense lists vs dashboards

## Related Skills

- **styles/digital-minimalism** — overlay
- **accessibility-design** — ADS + host product requirements
- **design-selector** — atlassian lock-in
