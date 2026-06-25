# Dashboard Analytics Template

Product shell with KPI strip, primary visualization, and data table.

## Wireframe

```text
┌──────────────────────────────────────────────────────────┐
│ [Nav]  Analytics                    [Export] [Date ▼]    │
├──────────────────────────────────────────────────────────┤
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐            │
│ │ KPI 1  │ │ KPI 2  │ │ KPI 3  │ │ KPI 4  │  ← strip   │
│ │ $12.4k │ │ +8.2%  │ │ 1,204  │ │ 3.2%   │            │
│ └────────┘ └────────┘ └────────┘ └────────┘            │
├───────────────────────────────┬──────────────────────────┤
│                               │                          │
│   [Primary chart 2/3 width]   │  [Secondary widget]      │
│                               │  Top segments / mini     │
│                               │                          │
├───────────────────────────────┴──────────────────────────┤
│ Filters: [Segment ▼] [Region ▼] [Search...]              │
├──────────────────────────────────────────────────────────┤
│ Data table                                    [Pagination]│
│ ┌──────┬─────────┬────────┬─────────┐                   │
│ │ Name │ Status  │ Amount │ Date    │                   │
│ ├──────┼─────────┼────────┼─────────┤                   │
│ │ ...  │         │        │         │                   │
│ └──────┴─────────┴────────┴─────────┘                   │
└──────────────────────────────────────────────────────────┘
```

## Spec Notes

| Zone | Spec |
|------|------|
| KPI strip | 4 metrics max; sparkline optional; delta with color + icon |
| Primary chart | One main question answered; legend accessible |
| Secondary | Ranking list or donut — not duplicate of primary |
| Table | Sortable columns; batch actions in toolbar |
| Filters | Persist in URL or visible chip state |

## Responsive

| Breakpoint | Behavior |
|------------|----------|
| <768px | KPI 2×2 grid; chart full width; table horizontal scroll |
| ≥1024px | Layout as wireframe |

## Empty States

- KPI: "—" with tooltip "No data for range"
- Chart: illustration + "Adjust filters" CTA
- Table: column headers remain; empty row message

## Anti-Slop

- Flat KPI tiles — no nested cards
- Solid chart backgrounds — no glass panels

## System Mapping

- Carbon: UI shell + Tile KPIs + DataTable
- Fluent: DataGrid + Card KPIs
- Material: Grid + Paper + MUI X DataGrid
