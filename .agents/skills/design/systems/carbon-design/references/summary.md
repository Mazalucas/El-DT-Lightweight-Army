# Carbon — Summary

## Themes

- White (light default), G10, G90, G100 (dark)
- Match theme to environment; fintech often G10 or white with strict contrast

## Typography

- IBM Plex Sans (UI), IBM Plex Mono (code, IDs)
- Type scale: productive vs expressive — use productive for app UI

## Key Components

- **DataTable** — sort, select, batch actions
- **Tabs** — container vs line (don't mix randomly)
- **Modal / Tearsheet** — progressive disclosure for complex flows
- **Notification** — toast vs inline vs actionable

## Layout

- 16-column grid (max 1584px)
- UI shell: header + left nav + content
- Content switcher for sub-views

## Spacing

- `$spacing-03` (8px) to `$spacing-09` (48px) — stay on scale

## Slop Avoidance

```markdown
❌ Carbon tiles for everything + marketing gradient header
✅ DataTable for data, expressive type only on marketing surface
```

## Links

- [Carbon Design System](https://carbondesignsystem.com/)
- [@carbon/react](https://react.carbondesignsystem.com/)
