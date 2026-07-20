---
name: slide-deck-html
description: "When building fullscreen HTML slide decks with keyboard navigation — pitch presentations for live demo or projector. Use when the user mentions 'presentación HTML,' 'slides fullscreen,' 'deck F11,' 'propuesta comercial HTML,' or references the slide-deck framework. Requires brand manual before generation. Complements presentation-decks (structure) and presentation-design (visual system)."
metadata:
  version: 1.0.0
---

# Slide Deck HTML Framework

Fullscreen presentation framework — structure and navigation extracted from commercial pitch patterns; **no client content** in repo templates.

## Gate obligatorio: manual de marca

**Detener** antes de generar HTML si falta manual de marca o guía de estilos.

Pedir al operador (o completar vía `/atelier init` + `brand-manual-checklist.md`):

| Campo | Ejemplo |
|-------|---------|
| Logo / wordmark | SVG, PNG, o texto estilizado |
| Paleta | primario, acento, neutros, fondo |
| Tipografías | display + body (+ fuentes web si aplica) |
| Tono | formal / expresivo / técnico |
| Restricciones | colores prohibidos, foto vs ilustración |

Registrar en `.agents/design-context.md` → **Brand manual**. Mapear a `frameworks/slide-deck-html/tokens.css`.

## Cuándo usar vs scroll pitch

| Necesidad | Template |
|-----------|----------|
| Presentar en vivo, F11, proyector | **slide-deck-html** |
| Enviar reporte scroll por link | `surface-presentation.md` + design system |
| Keynote / Google Slides | Spec desde este framework + export brief |

## Workflow

1. **Gate** — confirmar brand manual (detener si falta).
2. Leer `templates/shared/surface-slide-deck.md` + `frameworks/slide-deck-html/presentation.md`.
3. Aplicar tokens desde manual de marca.
4. Estructura narrativa: skill **presentation-decks**.
5. Copy: placeholders § Slide deck en `shared/placeholders.md`.
6. Generar el deck en el directorio del proyecto activo (no en esta librería base).
7. Validar: **anti-slop** + `./scripts/dt-design-detect.sh`.

## Layouts incluidos

- Portada con bg opcional
- Brief (label + H2 + body)
- Split video/texto
- Grid métricas
- Galería con lightbox
- Logo partner
- Cierre + contacto

## DEFER Rules

- **presentation-decks** — orden narrativo y cantidad de slides
- **presentation-design** — tema visual y tipografía
- **brand-guardian** — validación de uso de logo
- **frontend** — implementación en stack del proyecto

## Related Skills

- **presentation-decks** — narrative arc
- **presentation-design** — visual theme + brand gate
- **design-context** — persist brand manual
- **design-tokens** — expand tokens to CSS
