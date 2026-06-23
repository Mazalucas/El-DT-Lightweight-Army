# Design — Cerebro App

## Theme

Dual: `dark` | `light` | `system` (prefers-color-scheme). Default: `system`.

## Color (OKLCH, restrained)

- Brand hue: ~195 (teal-cyan)
- Accent shared: `oklch(0.58 0.11 195)` dark actions / `oklch(0.50 0.12 195)` light actions
- Dark bg: `oklch(0.13 0.012 250)` — not pure black
- Light bg: `oklch(0.97 0.008 250)` — off-white tinted, NOT cream
- Sidebar: one step darker/cooler than content surface

## Typography

- Family: IBM Plex Sans, system-ui, sans-serif
- Scale (rem): xs 0.75, sm 0.875, base 1, lg 1.125, xl 1.25, 2xl 1.5
- Line height: 1.5 body, 1.25 headings
- No fluid clamp on product headings

## Spacing & radius

- Space: 4px base — 1=4, 2=8, 3=12, 4=16, 5=20, 6=24, 8=32
- Radius: sm 6px, md 8px, lg 10px

## Motion

150–200ms ease-out. No page-load orchestration. Reduced motion → instant/crossfade.

## Z-index

dropdown 100, sticky 200, modal-backdrop 300, modal 400, toast 500

## Components

Button (primary/secondary/ghost/danger), Badge, Field, Table, Section, PageHeader, SegmentedControl, Skeleton, EmptyState, Toast, AppShell.
