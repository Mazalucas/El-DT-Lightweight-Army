# Glassmorphism — Principles

## Recipe (web)

```css
.glass-panel {
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
/* Fallback */
@supports not (backdrop-filter: blur(12px)) {
  .glass-panel { background: rgba(255, 255, 255, 0.95); }
}
```

## Quota

- Track % of viewport using blur — **max 30%**
- One glass layer depth — no glass on glass stacks

## Typography on Glass

- Prefer dark text on light glass or white text on dark glass with tested contrast
- Add text-shadow only as last resort — fix background instead

## Where OK

- Sticky header over hero image
- Modal scrim + panel
- Floating playback controls
- Tooltip/popover chrome

## Where Not OK

- Form fields
- Table rows
- Primary reading content
- Full-page app background

## Slop Combo Warning

Glass + purple gradient + Inter = triple slop — run anti-slop before ship.
