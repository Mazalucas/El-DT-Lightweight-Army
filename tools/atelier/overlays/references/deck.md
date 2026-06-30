# DT-only: deck / presentation

Fullscreen or scroll presentations — **requires brand manual**.

## Gate (hard stop)

1. Read `.agents/design-context.md` section **Brand manual**.
2. If missing → run `/atelier init` + `.cursor/skills/design/design-context/references/brand-manual-checklist.md`.
3. Do not generate client deck content in the DT template repo.

## Format choice

| Format | When |
|--------|------|
| **slide-deck-html** | Live demo, F11, projector |
| **surface-presentation** | Scroll doc, async reading |

## Skills (load in order)

1. `presentation-decks` — structure
2. `presentation-design` — visual system
3. `frameworks/slide-deck-html` — if fullscreen HTML

Template base: `.cursor/skills/design/templates/frameworks/slide-deck-html/presentation.md`

## Output location

Create deck in **active project directory**, not under `.cursor/skills/design/templates/`.

## Validation

`./scripts/atelier-detect.sh` on delivered HTML/CSS.
