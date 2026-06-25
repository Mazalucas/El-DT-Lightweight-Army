# IBM Carbon — Presentación pitch / reporte

> **Implementación (IA):** leé [`../../shared/surface-presentation.md`](../../shared/surface-presentation.md), [`../../shared/placeholders.md`](../../shared/placeholders.md) y [`../../PROTOCOL.md`](../../PROTOCOL.md). **Generá la UI en el stack del proyecto.** No ejecutes scripts de preview.

## Paleta curada

| Token | Valor | Uso |
|-------|-------|-----|
| ink | #0d0d0d | Nav oscuro, hero pitch, footer, table headers |
| paper | #f4f4f4 | Fondo base |
| accent | #0f62fe | CTAs en superficie clara, links activos |
| accent-dark | #78a9ff | Énfasis **sobre fondos oscuros** (hero, ask) |
| accent-soft | #e8f0ff | Recaps, quotes, avatares suaves |
| highlight | #f1c21b | Badges, acentos secundarios |
| gray | #525252 | Texto secundario |
| line | #dcdcdc | Bordes |
| radius | 0 | Cards y botones |

**Tipografía:** IBM Plex Sans

## Particularidades IBM Carbon

- **Sin border-radius** (0) en componentes Carbon.
- Shell oscuro en nav; interactive #0f62fe.
- Tipografía IBM Plex; tabular nums en métricas.
- Dashboard: data table densa, headers invertidos.

## Documento scroll con 7 layouts distintos. Usar accent-dark sobre hero/nav oscuros.

## Referencia profunda

- Skill DS: `design/systems/carbon-design/SKILL.md`
- Anti-slop: skill `anti-slop` antes de entregar

## Anti-patterns

- No mezclar tokens de otro design system.
- No clonar pitch en homepage ni dashboard.
- No `#000` puro — usar **ink** de la tabla.
