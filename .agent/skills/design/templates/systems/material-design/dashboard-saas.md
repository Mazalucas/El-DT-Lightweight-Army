# Material Design 3 Expressive — Dashboard SaaS

> **Implementación (IA):** leé [`../../shared/surface-dashboard.md`](../../shared/surface-dashboard.md), [`../../shared/placeholders.md`](../../shared/placeholders.md) y [`../../PROTOCOL.md`](../../PROTOCOL.md). **Generá la UI en el stack del proyecto.** No ejecutes scripts de preview.

## Paleta curada

| Token | Valor | Uso |
|-------|-------|-----|
| ink | #0f1419 | Nav oscuro, hero pitch, footer, table headers |
| paper | #fbfcff | Fondo base |
| accent | #005db8 | CTAs en superficie clara, links activos |
| accent-dark | #9fc6ff | Énfasis **sobre fondos oscuros** (hero, ask) |
| accent-soft | #d6e6ff | Recaps, quotes, avatares suaves |
| highlight | #ffd95e | Badges, acentos secundarios |
| gray | #44474e | Texto secundario |
| line | #c9ccd4 | Bordes |
| radius | 18px / pill CTAs | Cards y botones |

**Tipografía:** Roboto Flex

## Particularidades Material Design 3 Expressive

- Shape: escala expresiva (pill en CTAs, large-increased en cards).
- Color: primary filled buttons; secondary-container tonal; elevación por surface tonal, no sombras arbitrarias.
- Homepage: nav con chips; hero con FAB opcional; features en grid M3.
- Dashboard: **navigation rail** + search pill; KPIs en surface-container.
- Motion: spring suave en hover; respetar prefers-reduced-motion.

## App autenticada: rail/sidebar, KPIs, chart, tabla. Search accesible obligatorio.

## Referencia profunda

- Skill DS: `design/systems/material-design/SKILL.md`
- Anti-slop: skill `anti-slop` antes de entregar

## Anti-patterns

- No mezclar tokens de otro design system.
- No clonar pitch en homepage ni dashboard.
- No `#000` puro — usar **ink** de la tabla.
