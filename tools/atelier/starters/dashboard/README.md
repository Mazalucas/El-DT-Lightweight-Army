# Dashboard starter — copy to active project

Scaffold SaaS shell. Pair with `patterns/dashboard-patterns` + system template.

## Estructura sugerida

```text
src/
  components/dashboard/
    Shell.tsx      # sidebar + topbar
    KpiStrip.tsx
    MainPanel.tsx
  pages/dashboard.tsx
  styles/dashboard.css
```

## Shell regions

- Sidebar: nav items (max 7 primary)
- Topbar: search, user menu
- Main: KPI strip + content grid

## Checklist

1. KPI strip collapses on mobile (responsive-contract)
2. `./scripts/atelier-detect.sh src/`
