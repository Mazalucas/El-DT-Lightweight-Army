# Fluent Design 2 — Presentación pitch / reporte

> **Implementación (IA):** leé [`../../shared/surface-presentation.md`](../../shared/surface-presentation.md), [`../../shared/placeholders.md`](../../shared/placeholders.md) y [`../../PROTOCOL.md`](../../PROTOCOL.md). **Generá la UI en el stack del proyecto.** No ejecutes scripts de preview.

## Paleta curada

| Token | Valor | Uso |
|-------|-------|-----|
| ink | #1b1a19 | Nav oscuro, hero pitch, footer, table headers |
| paper | #faf9f8 | Fondo base |
| accent | #0067c0 | CTAs en superficie clara, links activos |
| accent-dark | #4ca3e8 | Énfasis **sobre fondos oscuros** (hero, ask) |
| accent-soft | #eaf3fc | Recaps, quotes, avatares suaves |
| highlight | #7cc4ff | Badges, acentos secundarios |
| gray | #605e5c | Texto secundario |
| line | #e1dfdd | Bordes |
| radius | 8px | Cards y botones |

**Tipografía:** Segoe UI Variable

## Particularidades Fluent Design 2

- Acrylic solo en nav/chrome (≤30% UI); cards opacas.
- Radius 4–12px; stroke #edebe9.
- Botones: primary #0067c0; hover más oscuro.
- Dashboard: command bar + paneles con shadow-2/4 sutiles.

## Documento scroll con 7 layouts distintos. Usar accent-dark sobre hero/nav oscuros.

## Referencia profunda

- Skill DS: `design/systems/fluent-design/GUIDE.md`
- Anti-slop: skill `anti-slop` antes de entregar

## Anti-patterns

- No mezclar tokens de otro design system.
- No clonar pitch en homepage ni dashboard.
- No `#000` puro — usar **ink** de la tabla.
