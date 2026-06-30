## DT session gate (El DT)

Before writing files in the repo:

1. Read `vitals/ops/session.yaml`. If missing or `operator.id` empty → stop and ask the user to run **`/yo`**.
2. Design context canonical path: **`.agents/design-context.md`** (not separate PRODUCT.md/DESIGN.md unless exporting).

## DT context loader

Run once per session (not per sub-command):

```bash
node tools/atelier/generated/scripts/context.adapter.mjs
```

Optional target for monorepos:

```bash
node tools/atelier/generated/scripts/context.adapter.mjs --target <path>
```

- If output reports **`NO_DESIGN_CONTEXT`**, stop and follow `tools/atelier/generated/references/init.md`.
- Imports `.agents/product-marketing.md` when present (see design-context skill).
- **`UPDATE_AVAILABLE`**: offer `/atelier actualizar` (DT maintainer sync), then continue.

## Register references (DT paths)

| Register | File |
|----------|------|
| Brand (marketing, landing, portfolio) | `tools/atelier/generated/references/brand.md` |
| Product (app, dashboard, tool) | `tools/atelier/generated/references/product.md` |

Map `register` from design-context sections — do not create duplicate PRODUCT.md/DESIGN.md.

## DT-native subcommands

| Command | Action |
|---------|--------|
| `/atelier select [brief]` | `ruby scripts/dt-design-select.rb "brief"` + skill `design-selector` |
| `/atelier read` | skill `design-read` — V/M/D dials |
| `/atelier tokens` | skill `design-tokens` |
| `/atelier template [name]` | skill `ui-templates` or `--scaffold` → `tools/atelier/starters/` |
| `/atelier deck [brief]` | `references/deck.md` — brand manual gate + slide-deck-html |
| `/atelier actualizar` | skill `atelier-actualizar` — sync Impeccable upstream |

## DT extensions (after Impeccable setup)

When building surfaces, load **one** tactical skill from `.cursor/skills/design/`:

| Moment | Skill |
|--------|-------|
| Post-init | `design-selector` |
| Pre-craft/shape | `design-read` |
| Surface layout | `system-templates`, `style-templates`, `patterns/*` |
| Pre-ship | `anti-slop` + `./scripts/atelier-detect.sh` |

Ecosystem lock-in (Shopify, Atlassian) → DT pack wins over generic Impeccable defaults.

## Agent routing

- **craft / shape+build:** write production UI code directly (stack: regla `08-stack-web-default`).
- **critique / audit / polish:** may stay spec-only or fix code in place.
- Handoff to **frontend** when: backend integration, large refactor, E2E tests, or user asks.

## Engineering reuse (craft/build)

Apply regla `15-engineering-reuse`: discover repo UI before creating new modules.
