# Apple Human Interface Guidelines — Dashboard SaaS

> **Implementación (IA):** leé [`../../shared/surface-dashboard.md`](../../shared/surface-dashboard.md), [`../../shared/placeholders.md`](../../shared/placeholders.md) y [`../../PROTOCOL.md`](../../PROTOCOL.md). **Generá la UI en el stack del proyecto.** No ejecutes scripts de preview.

## Paleta curada

| Token | Valor | Uso |
|-------|-------|-----|
| ink | #1a1a1c | Nav oscuro, hero pitch, footer, table headers |
| paper | #f5f5f7 | Fondo base |
| accent | #0071e3 | CTAs en superficie clara, links activos |
| accent-dark | #2997ff | Énfasis **sobre fondos oscuros** (hero, ask) |
| accent-soft | #e9f3fe | Recaps, quotes, avatares suaves |
| highlight | #6cb6ff | Badges, acentos secundarios |
| gray | #6e6e73 | Texto secundario |
| line | #d2d2d7 | Bordes |
| radius | 18px | Cards y botones |

**Tipografía:** SF Pro (system)

## Particularidades Apple Human Interface Guidelines

- Tipografía sistema (-apple-system); jerarquía por peso/tamaño.
- Radius 10–20px en cards; separators sutiles.
- Homepage: hero puede ir más centrado; mucho whitespace.
- Dashboard: sidebar grouped list; materiales opacos (glass ≤30% solo en chrome).
- Azul sistema #0071e3; evitar sombras pesadas.

## App autenticada: rail/sidebar, KPIs, chart, tabla. Search accesible obligatorio.

## Referencia profunda

- Skill DS: `design/systems/apple-hig/GUIDE.md`
- Anti-slop: skill `anti-slop` antes de entregar

## Anti-patterns

- No mezclar tokens de otro design system.
- No clonar pitch en homepage ni dashboard.
- No `#000` puro — usar **ink** de la tabla.
