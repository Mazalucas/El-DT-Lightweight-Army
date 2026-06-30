# Design context — Cerebro App

register: product
updated: 2026-06-26
owner: lucas

## Product

Cerebro App es un segundo cerebro profesional: reuniones Meet, contactos, tareas, red de relaciones e inteligencia IA. El usuario entra por **Hoy** (briefing matutino) y trabaja en superficies densas el resto del día.

## Visual metaphor: Signal / Surface / Silence

| Tier | Surfaces | Rule |
|------|----------|------|
| **Silence** | Shell, tablas, ajustes, org resumen | Herramienta invisible; densidad útil |
| **Surface** | Kanban, reuniones, graph chrome, detalle | Trabajo habitual; una familia tipográfica |
| **Signal** | Hoy briefing, prep insights, sugerencias IA, alertas | Color committed; ~15–20% viewport en Hoy |

## V / M / D dials

- **Voice:** Preciso, rioplatense en copy; UI labels cortos
- **Motion:** 150–220ms state-only; reduced-motion = instant
- **Density:** Media-alta en tablas; Hoy más aire en Signal

## Color strategy

- Restrained neutrals (hue 250) en Silence/Surface
- Signal: `--signal-primary` (210), `--signal-secondary` (280)
- Light: off-white frío, no cream/sand
- Dark: grafito azul L~0.13
- System default; paridad light/dark

## Typography

- IBM Plex Sans única familia
- Signal headlines: `--text-signal-xl`, tracking ≥ -0.04em
- Prose briefing: max 65ch, `text-wrap: pretty`

## Anti-references (do not)

- Side-stripe borders (`border-left` > 1px accent on cards)
- kpi-grid 4-up hero cards on dashboards
- Cream/sand body backgrounds
- Ghost cards (1px border + wide shadow)
- Gradient text, glassmorphism default
- Identical icon+heading+text card grids
- Signal color on inactive table rows

## Component tiers

- Signal: `.hoy-briefing`, `.hoy-meeting-prep`, `.smart-suggestion--signal`, `.hoy-attention-bar`, `.hoy-calendar-timeline`
- Surface: `.kanban-*`, `.graph-panel`, `.dash-panel`, `.data-table`
- Silence: `.app-shell`, `.stat-strip`, `.maintenance-list`

## Stack

- CSS custom properties in `modules/cerebro-app/src/styles/tokens.css`
- Global classes + `ds.tsx` React wrappers
- No Tailwind
