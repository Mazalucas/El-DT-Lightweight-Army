# Atlassian Design System — Dashboard SaaS

> **Implementación (IA):** leé [`../../shared/surface-dashboard.md`](../../shared/surface-dashboard.md), [`../../shared/placeholders.md`](../../shared/placeholders.md) y [`../../PROTOCOL.md`](../../PROTOCOL.md). **Generá la UI en el stack del proyecto.** No ejecutes scripts de preview.

## Paleta curada

| Token | Valor | Uso |
|-------|-------|-----|
| ink | #0e1b32 | Nav oscuro, hero pitch, footer, table headers |
| paper | #f7f8f9 | Fondo base |
| accent | #0052cc | CTAs en superficie clara, links activos |
| accent-dark | #85b8ff | Énfasis **sobre fondos oscuros** (hero, ask) |
| accent-soft | #e3edff | Recaps, quotes, avatares suaves |
| highlight | #ffc44d | Badges, acentos secundarios |
| gray | #5e6c84 | Texto secundario |
| line | #dfe1e6 | Bordes |
| radius | 8px | Cards y botones |

**Tipografía:** Charlie / Segoe UI fallback

## Particularidades Atlassian Design System

- Primary #0052cc; subtle #deebff; texto #172b4d.
- Radius 3–8px; sombras overlay para modales.
- Homepage: enterprise SaaS; cards raised blancas sobre sunken #f7f8f9.
- Dashboard: navigation sidebar + tablas con bordes #dfe1e6.

## App autenticada: rail/sidebar, KPIs, chart, tabla. Search accesible obligatorio.

## Referencia profunda

- Skill DS: `design/systems/atlassian-design/GUIDE.md`
- Anti-slop: skill `anti-slop` antes de entregar

## Anti-patterns

- No mezclar tokens de otro design system.
- No clonar pitch en homepage ni dashboard.
- No `#000` puro — usar **ink** de la tabla.
