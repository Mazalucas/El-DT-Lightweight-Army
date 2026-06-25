# DT overlay: init → design-context

> Replaces Impeccable PRODUCT.md/DESIGN.md split with unified `.agents/design-context.md`.

## Goal

Create or update **`.agents/design-context.md`** — single source of truth for product + visual direction in El DT.

## Prerequisites

- Valid session (`/yo`) before writing files.
- If `.agents/product-marketing.md` exists → **import** positioning, audience, tone; link, do not duplicate.

## Interview flow

1. **Register:** brand (marketing/landing/portfolio) vs product (app/dashboard/tool).
2. **Surfaces:** primary surface, in-scope now, out-of-scope.
3. **Design dials V/M/D** (1–5 each) with one-line rationale — not all 3s.
4. **Anti-patterns:** explicit list (e.g. no purple gradients, no Inter default).
5. **Tokens summary:** palette, type stack, radius (OKLCH preferred).
6. **Brand manual** (required before decks): logo, palette, typography — see `.cursor/skills/design/design-context/references/brand-manual-checklist.md`.

## Write document

Follow schema: `.cursor/skills/design/design-context/references/context-schema.md`.

Use skill **`design-context`** for full workflow.

## After init

Recommend next steps:

```text
/atelier select "<brief>"
/atelier read
/atelier craft <surface>
```

Run `./scripts/atelier-detect.sh` before handoff when code exists.

## Do NOT

- Create standalone `PRODUCT.md` or `DESIGN.md` in project root (unless user explicitly exports for external tools).
- Skip anti-patterns section (high slop risk).
