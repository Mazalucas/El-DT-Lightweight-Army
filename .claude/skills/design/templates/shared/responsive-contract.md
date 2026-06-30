# Contrato responsive — Atelier templates

**Obligatorio** en toda superficie. Breakpoint principal: **900px** (tablet/mobile).

## Navegación móvil

| Superficie | Desktop | Mobile |
|------------|---------|--------|
| Homepage `.tpl-nav` | links inline + CTA | **burger** → drawer derecho (links + CTA) |
| Dashboard `.tpl-sidebar` | sidebar fijo | **burger en topbar** → drawer lateral |
| Pitch `.doc-nav` | anclas + CTA | **burger** → drawer (anclas + CTA) |
| Material `.m3-top-bar` | chips inline | **burger** → drawer |
| Material `.m3-rail` | rail 80px | **burger** → **bottom sheet** |
| Style `.shell > aside` | sidebar | **burger en top** → drawer |
| Style float nav | pills flotantes | **burger** → bottom sheet glass |

Implementación recomendada: componentes explícitos por superficie (no auto-mutar DOM).
`preview/shared/responsive.css` aporta fallback seguro para previews legacy.

## Reacomodo inteligente

- **Hero:** 1 columna; visual arriba (`order: -1`) o debajo según superficie.
- **Features / grids:** 1 columna en mobile.
- **KPIs dashboard:** fila con **scroll snap horizontal** (no 4 filas apiladas).
- **Tablas:** scroll horizontal con máscara de fade.
- **Topbar:** search full-width en segunda fila; acciones secundarias ocultas.
- **Safe areas:** `env(safe-area-inset-*)` en drawers y sheets.

## Motion moderno (cuando se implemente burger)

- Drawer: `cubic-bezier(0.32, 0.72, 0, 1)` (curva iOS).
- Items del menú: stagger 45ms por ítem.
- Overlay: blur + tint oscuro.
- `prefers-reduced-motion`: sin animaciones.

## Por design system (previews)

Cada override puede definir:

- `--atelier-drawer-radius` — Carbon/Atlassian: `0`; Apple: `22px`; Polaris: `16px`.
- `--atelier-drawer-edge` — Carbon: borde primario 3px.

Respetar shape, densidad y motion del DS; el patrón burger/drawer es compartido.

## Checklist IA

1. ¿Nav/sidebar tiene equivalente mobile accesible (burger, 44px touch)?
2. ¿Grids colapsan sin overflow horizontal no intencional?
3. ¿Tablas tienen scroll o card stack?
4. ¿CTA principal sigue visible (drawer o barra)?
5. ¿Reduced motion respetado?

Referencia CSS: `preview/shared/responsive.css` · Contraste: [`contrast-contract.md`](contrast-contract.md).
