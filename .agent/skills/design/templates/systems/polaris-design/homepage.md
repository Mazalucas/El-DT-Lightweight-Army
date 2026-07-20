# Shopify Polaris — Homepage producto y servicio

> **Implementación (IA):** leé [`../../shared/surface-homepage.md`](../../shared/surface-homepage.md), [`../../shared/placeholders.md`](../../shared/placeholders.md) y [`../../PROTOCOL.md`](../../PROTOCOL.md). **Generá la UI en el stack del proyecto.** No ejecutes scripts de preview.

## Paleta curada

| Token | Valor | Uso |
|-------|-------|-----|
| ink | #15201b | Nav oscuro, hero pitch, footer, table headers |
| paper | #f1f1f1 | Fondo base |
| accent | #008060 | CTAs en superficie clara, links activos |
| accent-dark | #4bbf94 | Énfasis **sobre fondos oscuros** (hero, ask) |
| accent-soft | #e3f1df | Recaps, quotes, avatares suaves |
| highlight | #7ad6ad | Badges, acentos secundarios |
| gray | #5c5f62 | Texto secundario |
| line | #e1e3e5 | Bordes |
| radius | 12px | Cards y botones |

**Tipografía:** Inter (excepción documentada — ecosistema Shopify)

## Particularidades Shopify Polaris

- Primary verde #008060; superficies #f1f1f1 / card blanco.
- Radius 8–12px; sombra mínima (1px border feel).
- Homepage: tono commerce/SaaS merchant-friendly.
- Dashboard: top bar + sidebar estilo admin Shopify.

## Marketing landing — ver wireframe en shared. Aplicar particularidades M3/Apple/etc. del bloque inferior.

## Referencia profunda

- Skill DS: `design/systems/polaris-design/GUIDE.md`
- Anti-slop: skill `anti-slop` antes de entregar

## Anti-patterns

- No mezclar tokens de otro design system.
- No clonar pitch en homepage ni dashboard.
- No `#000` puro — usar **ink** de la tabla.
