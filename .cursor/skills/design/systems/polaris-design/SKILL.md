---
name: polaris-design
description: "When designing Shopify apps, merchant admin, checkout extensions, or Polaris Web Components. Also use when the user mentions 'Shopify Polaris,' 'merchant admin,' 'checkout UI extension,' or 'Shopify app.' Ecosystem lock — do not substitute Material or Carbon."
metadata:
  version: 1.0.0
---

# Shopify Polaris

Shopify's design system for merchant-facing admin and app surfaces.

## Canonical templates

| Superficie | Spec |
|------------|------|
| Homepage | `templates/systems/polaris-design/homepage.md` |
| Presentación | `templates/systems/polaris-design/presentation.md` |
| Dashboard SaaS | `templates/systems/polaris-design/dashboard-saas.md` |

Skill: **system-templates**

## When to Use

- Shopify app (embedded admin) — **ecosystem lock**
- Checkout UI extensions
- Merchant settings, orders, inventory workflows

## When Not to Use

- Non-Shopify SaaS dashboards
- Storefront theme design (Online Store 2.0 — theme skills separate; use brand direction)
- Standalone marketing site unrelated to Shopify

## Library

- Polaris Web Components (CDN — preferred new apps)
- `@shopify/polaris` (React, legacy migration path)

## Core Principles

1. **Merchant-first** — reduce cognitive load for busy store owners
2. **Consistent with admin** — apps feel native to Shopify
3. **Accessible defaults** — Polaris components handle baseline a11y
4. **Resource picker patterns** — use Shopify-provided flows

## Accessibility

- Polaris handles focus, labels on form components
- Do not override admin chrome accessibility
- Test in embedded app context (iframe constraints)

## Anti-Slop Risks

- Custom nav duplicating Shopify app nav
- Non-Polaris modals breaking merchant expectations
- Dense data viz ignoring Polaris Page + Layout patterns
- Brand gradients conflicting with admin neutral shell

See `references/summary.md`.

## DEFER Rules

- **frontend** — Polaris component implementation
- **brand-guardian** — storefront brand vs admin app brand (different surfaces)

## Related Skills

- **styles/digital-minimalism** — overlay per decision matrix
- **patterns/dashboard-patterns** — merchant analytics layouts
- **design-selector** — confirms lock-in
