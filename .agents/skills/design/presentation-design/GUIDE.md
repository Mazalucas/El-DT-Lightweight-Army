---
name: presentation-design
description: "When defining visual design for slides, pitch decks, or presentation aesthetics — typography, color theme, slide masters, chart style. Also use when the user mentions 'slide design,' 'deck visuals,' 'presentation theme,' 'Keynote template,' or complements presentation-decks structure skill."
metadata:
  version: 1.0.0
---

# Presentation Design

Visual system for slides — structure lives in **presentation-decks**.

## Brand manual gate (obligatorio)

**Detener** antes de generar cualquier presentación (HTML slide deck, scroll pitch, Keynote/PPT spec) si no hay manual de marca o guía de estilos.

1. Verificar `.agents/design-context.md` → sección **Brand manual**
2. Si falta: pedir logo, paleta, tipografías, tono y restricciones — o completar `design-context/references/brand-manual-checklist.md` vía `/atelier init`
3. Invocar **brand-guardian** si hay logo usage o compliance estricto
4. Solo entonces elegir formato y aplicar tokens

**No** copiar colores/tipos de propuestas de referencia compartidas por el usuario; adoptar solo **estructura** (ver **slide-deck-html**).

## Workflow

1. **Brand manual gate** — confirmar o completar checklist
2. Read design-context + **design-read** (deck surface: V 2, M 2–4, D 2–3)
3. Choose format: **slide-deck-html** (fullscreen live) vs **surface-presentation** (scroll doc)
4. Choose theme: light authoritative vs dark cinematic — desde manual de marca
5. Define slide master tokens (subset of **design-tokens**)
6. Apply style overlay if any (bauhaus for creative pitch)
7. Spec 3–5 reusable slide layouts

## Theme Tokens (presentation)

| Token | Guidance |
|-------|----------|
| Slide bg | Solid or subtle gradient (brand only) |
| Title | 44–60pt equivalent |
| Body | 24–32pt min projected |
| Accent | One color for emphasis |
| Chart | 2–3 series max colors |

## Layout Masters

1. **Title** — logo, headline, date
2. **Section** — chapter divider, large type
3. **Content** — title bar + body zone
4. **Split** — text + visual 50/50
5. **Metric** — single number hero
6. **Closing** — CTA, contact, QR

## Chart Style

- Remove chartjunk — no 3D
- Direct labels where possible
- High contrast for projector washout

## Motion (M dial)

- Slide transitions: fade or none (M≤2 for investor)
- Build animations: one element at a time max
- `prefers-reduced-motion` in exported PDF/video N/A — keep static safe version

## Anti-Slop

- Stock photo every slide
- Default PowerPoint template blues
- 10-line bullet slides (structure issue → presentation-decks)

## DEFER Rules

- **pitch-specialist** — story and content
- **presentation-decks** — slide order and narrative
- **brand-guardian** — logo clearspace on slides
- **frontend** — only if building HTML/reveal.js deck

## Related Skills

- **frameworks/slide-deck-html** — fullscreen HTML deck + navigation
- **patterns/presentation-decks** — narrative structure
- **styles/bauhaus-style** — expressive pitches
- **design-tokens** — shared brand colors
- **design-context** — brand manual persistence
- **motion-design** — transition specs
