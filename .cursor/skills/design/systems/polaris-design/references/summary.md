# Polaris — Summary

## Page Structure

```text
Page
  └─ Layout (sections)
       └─ Layout.Section (primary / secondary / oneHalf)
            └─ Card / Form / ResourceList
```

## Key Components

- **Page** — title, primary action, breadcrumbs
- **Card** — grouped content; avoid nesting cards
- **Banner** — status messaging
- **IndexTable** — merchant lists (orders, products)
- **Filters** — list filtering patterns

## Actions

- Primary action in Page header (one per page)
- Destructive actions require confirmation modal

## Embedded Apps

- Use App Bridge for navigation integration
- Respect admin top bar and mobile breakpoints

## Slop Avoidance

```markdown
❌ Full custom dashboard ignoring IndexTable/Filters
✅ Polaris Page + IndexTable + native filter bar
```

## Links

- [Polaris](https://polaris.shopify.com/)
- [Polaris Web Components](https://shopify.dev/docs/api/app-home/polaris-web-components)
