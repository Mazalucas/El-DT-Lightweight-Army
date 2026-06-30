---
name: presentation-decks
description: "When designing slide decks, pitch presentations, keynote layouts, or investor deck structure. Also use when the user mentions 'pitch deck,' 'slides,' 'presentation layout,' 'Keynote,' 'Google Slides,' or surface type deck. Complements presentation-design for visual system."
metadata:
  version: 1.0.0
---

# Presentation Deck Patterns

Slide structure and narrative flow — visual polish in **presentation-design**. Fullscreen HTML implementation: **slide-deck-html**.

## Brand manual gate

Antes de definir slides finales, confirmar manual de marca (ver **presentation-design**). Sin marca: detener o completar checklist en `design-context/references/brand-manual-checklist.md`.

## Deck Types

| Type | Slides | Focus |
|------|--------|-------|
| Investor pitch | 10–15 | Problem, solution, market, traction, ask |
| Sales demo | 8–12 | Pain, demo storyboard, proof, CTA |
| Internal update | 5–8 | Metrics, wins, blockers, next |
| Conference talk | 20–40 | Story arc, one idea per slide |

## Narrative Arc (investor)

```text
Title → Problem → Solution → Demo/screens → Market → Business model →
Traction → Team → Ask → Appendix
```

## Slide Patterns

1. **Title** — one line + subtitle; no paragraph
2. **Statement** — big claim + one supporting visual
3. **Split** — text left, visual right (7/5)
4. **Metric** — one number hero + context line
5. **Timeline** — horizontal milestones max 5
6. **Comparison** — 2 columns, not 4 cramped
7. **Closing CTA** — contact, QR, next step

## Design Constraints

- Max 6 bullets per slide; prefer 3
- Font size floor: 24pt body projected
- Dark or light theme — pick one, no mix mid-deck
- Charts: one insight per chart

## Anti-Slop

- No stock photo full-bleed every slide
- No 12-line bullet slides
- No default template rainbow charts

## DEFER Rules

- **pitch-specialist** — narrative and investor story
- **presentation-design** — visual theme and typography
- **copywriting** — slide copy refinement

## Format selection

| Formato | Cuándo | Skill / template |
|---------|--------|------------------|
| Live pitch, F11, proyector | Presentación en sala | **slide-deck-html** |
| Reporte scroll, link email | Documento largo | `surface-presentation.md` + DS |
| Keynote / Slides | Export externo | Spec desde layouts + brand manual |

## Related Skills

- **frameworks/slide-deck-html** — HTML fullscreen framework
- **presentation-design** — visual system for slides
- **styles/bauhaus-style** — bold deck aesthetics
- **design-read** — M dial for slide transitions
