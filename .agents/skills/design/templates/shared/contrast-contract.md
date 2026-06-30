# Contrato de contraste — Atelier templates

**Obligatorio** en toda superficie (homepage, pitch scroll, slide deck, dashboard, estilos visuales).

## Regla base

| Fondo | Texto principal | Texto secundario | Acento |
|-------|-----------------|------------------|--------|
| **Claro** (`paper`, `surface`, `bg`) | Oscuro (`ink`, `text-primary`) | Gris medio (`text-muted`, `gray`) | Saturado sobre claro |
| **Oscuro** (`ink`, `deck-bg`, sidebar dark) | Claro (`paper`, `text-on-dark`) | Claro al 55–75% opacidad | **Accent-on-dark** (tinte claro del acento) |

**Prohibido:** oscuro sobre oscuro · claro sobre claro · acento del mismo tono que el fondo sin separación.

Los acentos pueden variar en tonalidad (azul claro sobre nav oscuro, verde sobre banda primaria, etc.), pero el **par fondo/texto** siempre debe invertir luminosidad.

## Pares de tokens (implementar siempre)

### Superficies `--tpl-*` (homepage, dashboard shell)

| Token fondo | Token texto |
|-------------|-------------|
| `--tpl-bg` | `--tpl-text` |
| `--tpl-surface` | `--tpl-text` |
| `--tpl-surface-alt` | `--tpl-text` |
| `--tpl-primary` (filled button, CTA band) | `--tpl-on-primary` |
| `--tpl-sidebar-bg` | `--tpl-sidebar-brand`, `--tpl-sidebar-link` |
| `--tpl-sidebar-bg` (hover) | `--tpl-sidebar-link-hover` |
| `--tpl-sidebar-bg` (active) | `--tpl-sidebar-link-active` |
| `--tpl-sidebar-bg` (footer) | `--tpl-sidebar-footer` |

**Sidebar oscuro:** definir explícitamente links claros. **Nunca** usar `--tpl-text` (texto del main) dentro del sidebar.

### Documento scroll `--doc-*` (pitch / reporte)

| Token fondo | Token texto |
|-------------|-------------|
| `--doc-paper` | `--doc-ink` |
| `--doc-ink` (nav, hero, footer, filas total) | `--doc-paper` |
| `--doc-accent` (CTA filled, labels en claro) | `--doc-on-accent` |
| `--doc-ink` / hero oscuro (énfasis, kicker, monto) | `--doc-accent-dark` (tinte **claro**) |
| `--doc-accent-soft` | `--doc-ink` |
| Cards `#fff` / `--doc-surface` | `--doc-ink` + `--doc-gray` body |

### Slide deck `--deck-*`

| Token fondo | Token texto |
|-------------|-------------|
| `--deck-bg` (típico oscuro) | `--deck-text`, `--deck-text-muted` |
| `--deck-surface` (cards sobre oscuro) | `--deck-text` |
| `--deck-accent` (badges, H1 cierre) | `--deck-on-accent` |
| Variante slide claro | `--deck-text-on-light` sobre `--deck-bg-light` |

### Estilos visuales (`styles/*`)

Cada `tokens.css` debe declarar pares `--color-on-*` para cada bloque de color sólido (accent, primary blocks, glass sobre rich bg).

## Checklist antes de entregar

1. ¿Cada región tiene par fondo/texto definido en tokens?
2. ¿Sidebar/rail/nav oscuro usa tokens de sidebar, no `--tpl-text`?
3. ¿CTA filled tiene `--on-primary` / `--on-accent`?
4. ¿Hero oscuro usa `accent-dark` (claro), no `accent` (saturado oscuro)?
5. ¿Hover no empeora contraste (p. ej. texto oscuro sobre hover oscuro)?

## Referencia CSS (previews legacy)

`preview/shared/contrast.css` — fallbacks y reglas de alcance sidebar.
