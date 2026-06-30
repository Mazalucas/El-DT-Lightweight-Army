---
name: dashboard-patterns
description: "When designing admin dashboards, analytics views, data-dense product UI, or executive summaries. Also use when the user mentions 'dashboard,' 'analytics page,' 'admin panel,' 'KPI cards,' 'data-dense,' or pattern data-dense-dashboard / executive."
metadata:
  version: 1.0.0
---

# Dashboard Patterns

Product-surface layouts for monitoring, analysis, and operations.

## Context

Design-read defaults: **V 3–4, M 1–2, D 1–2**. Prefer **carbon-design**, **material-design**, or **fluent-design** per selector.

## Pattern Catalog

### 1. Data-Dense Dashboard (fintech, ops)

- KPI row (4–6 metrics max above fold)
- Primary chart + supporting table
- Filters left or top — persistent state visible
- Carbon DataTable / Fluent DataGrid patterns

### 2. Executive Summary

- Large KPIs, trend deltas, period selector
- Minimal chart count (1–2 hero insights)
- Export/share actions in header

### 3. Feature-Rich App Home (SaaS)

- Quick actions + recent activity feed
- Empty states with onboarding CTA
- Not a marketing hero — task-first

### 4. Analytics Explorer

- Global date range + segment filters
- Chart tabs or side-by-side compare
- Drill-down to table detail view

## Layout Shell

```text
[Global nav] | [Page header: title + actions + filters]
              | [KPI strip]
              | [Main viz 2/3] [Secondary 1/3]
              | [Table full width]
```

## Anti-Slop

- No empty chart placeholders in final spec
- No nested KPI cards (SLOP010)
- No glass on tables
- Meaningful empty states, not "No data" only

## DEFER Rules

- **frontend** — chart libraries, data binding
- **arquitecto** — data API shape for widgets

## Related Skills

- **systems/carbon-design** — enterprise dense UI
- **ui-templates** — dashboard-analytics scaffold
- **responsive-layout** — collapse KPI strip on mobile
- **accessibility-design** — chart alt text, table headers
