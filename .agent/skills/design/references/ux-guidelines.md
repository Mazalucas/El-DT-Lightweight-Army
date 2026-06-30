# UX guidelines (Atelier condensed)

Condensed from ui-ux-pro-max / Impeccable patterns. Full rules live in skills under `design/`.

## Layout

- One primary action per view when possible
- 8px grid baseline; consistent spacing tokens
- Max line length ~65–75ch for body text
- Breakpoints: 375, 768, 1024, 1440

## Interaction

- `cursor-pointer` on all clickables
- Hover transitions 150–300ms
- Respect `prefers-reduced-motion`
- No bounce/elastic easing

## Accessibility

- Text contrast minimum 4.5:1 (AA)
- Visible focus rings
- Touch targets ≥44px
- No emoji as icons — use SVG

## Anti-patterns

- Inter/Arial as unmodified defaults
- Purple-blue gradient heroes
- Glass on every card
- Nested cards
- Gray text on colored backgrounds
- Pure #000 / #fff without tint

## Forms

- Labels visible (not placeholder-only)
- Inline validation with clear errors
- Loading and empty states designed

## Dashboards

- Hierarchy: KPI → trend → detail
- Density matches audience (executive vs analyst)
- Charts: pick type for data (see dashboard-patterns skill)
