# DT overlay: craft — write production UI code

> El DT craft mode writes **real code** in the project stack (paridad Impeccable).

## Stack (obligatorio)

Read `vitals/data/engineering/web-stack.yaml`. Default: Node + Firebase + Vite + React unless repo signals otherwise.

## Reuse-first

Before new files:

1. Grep existing components, tokens, layouts.
2. Extend design system / UI library already in repo.
3. Document in delivery: **Qué reutilicé** / **Qué creé y por qué**.

## Build flow

1. Run **design-read** (V/M/D) unless dials already in design-context.
2. Optional: `/atelier select` → load one system/style template from `.cursor/skills/design/templates/`.
3. Execute upstream craft reference steps (shape gates, visual iteration, browser verification).
4. **Implement** in project source — not specs-only.
5. Pre-ship: `./scripts/atelier-detect.sh <paths>` — fix P0 slop before done.

## Handoff

- Default: **no** automatic DEFER to frontend when craft completes working UI.
- DEFER to **frontend** only for: API wiring, auth backend, test suites, or user request.
- DEFER to **brand-guardian** if brand manual conflict.

## Quality bar

Production-grade: responsive (375/768/1024/1440), a11y AA, `prefers-reduced-motion`, no AI slop tells.
