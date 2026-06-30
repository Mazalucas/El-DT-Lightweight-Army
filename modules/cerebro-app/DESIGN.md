# Cerebro App — Design System

Register: **product** · Metaphor: **Signal / Surface / Silence**

Canonical context: [`.agents/design-context.md`](../../.agents/design-context.md)

## Tokens

Source: [`src/styles/tokens.css`](src/styles/tokens.css)

- **Silence:** `--bg-canvas`, `--fg-primary`, `--fg-muted`, `--border-default`
- **Surface:** `--surface-work`, `--surface-hover`, `--kanban-column-bg`
- **Signal:** `--signal-primary`, `--signal-secondary`, `--signal-bg`, `--briefing-bg`, `--insight-bg`

Legacy aliases (`--bg`, `--accent`, `--ink`) remain for gradual migration.

## Style entry

[`src/styles/index.css`](src/styles/index.css) — orchestrator for split component layers + signal tier.

## Tiers

| Tier | Examples |
|------|----------|
| Signal | `.hoy-briefing`, `.hoy-meeting-prep`, `.smart-suggestion--signal`, `.hoy-attention-bar` |
| Surface | `.kanban-*`, `.graph-panel`, `.dash-panel` |
| Silence | `.stat-strip`, `.maintenance-item`, `.app-nav-link` |

## Rules

- No `border-left` accent stripes on cards
- Signal color only on Signal tier + primary CTA
- IBM Plex Sans only; `--text-signal-xl` for briefing headlines
- Light/dark parity via `data-theme`
