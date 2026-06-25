# Superficie — Slide deck HTML (fullscreen)

**Tipo:** presentación pantalla completa, navegación por teclado/clic. **No** es documento scroll (`surface-presentation.md`).

Placeholders: [`placeholders.md`](placeholders.md) · Framework: [`../frameworks/slide-deck-html/presentation.md`](../frameworks/slide-deck-html/presentation.md) · Protocolo: [`../PROTOCOL.md`](../PROTOCOL.md)

## Gate obligatorio

Antes de implementar, el DT/Atelier debe tener **manual de marca o guía de estilos** (ver `presentation-design` § Brand manual gate). Sin eso: detener y pedir assets.

## Wireframe global (11 slides tipo pitch comercial)

```text
[logo fijo top-left] · [contador bottom-left] · [hint nav center] · [branding bottom-right]

1. Portada — título + bg opcional
2. Contexto — label + H2 + split video/texto
3. Problema — label + H2 + párrafo (layout asimétrico)
4. Datos — label + H2 + grid 2×N métricas
5. Problema mercado — label + H2 + párrafo con énfasis accent
6. Solución — label + H2 + split video/texto
7. Propuesta — H2 + subtítulo + galería imágenes (lightbox)
8. Compromiso — label + H2 + párrafo
9. Entregables — label + H2 + párrafo con énfasis
10. Partner / prensa — label + H2 + logo partner
11. Cierre — H1 accent + contacto
```

Ajustar cantidad de slides según tipo de deck (`presentation-decks`); mantener **patrones de layout** reutilizables.

## Patrones de layout (reutilizables)

| Clase / patrón | Uso |
|----------------|-----|
| `slide-content` | **Obligatorio** — envuelve el contenido de cada slide; centra label, título y body |
| `slide-content--wide` | Variante max-width 1100px (split video, galería) |
| `slide-brief` | Label kicker + H2 + body (todo centrado vía `slide-content`) |
| `slide-solucion-video` | Grid 50/50 video + texto |
| `slide-datos` | Grid 2 cols de stat cards (texto centrado en cards) |
| `slide-gallery` | Grid imágenes con lightbox |
| `slide-partner` | Logo partner centrado |
| `slide-bg-placeholder` | Fondo decorativo (position absolute, no afecta centrado) |

## Paleta (desde manual de marca)

Mapear tokens del manual a variables CSS — ver `frameworks/slide-deck-html/tokens.css`:

| Token | Rol |
|-------|-----|
| `--deck-bg` | Fondo principal (típico oscuro cinematic) |
| `--deck-accent` | Labels, números, énfasis |
| `--deck-text` | Texto primario |
| `--deck-text-muted` | Subtítulos, hints |
| `--deck-surface` | Cards semi-transparentes |
| `--deck-on-accent` | Texto sobre badges/botones accent |
| `--deck-text-on-light` | Texto si `--deck-bg-light` (variante clara) |

**Regla:** fondo oscuro (`--deck-bg`) → `--deck-text` claro; acento filled → `--deck-on-accent`. Ver [`contrast-contract.md`](contrast-contract.md).

**Responsive:** padding con `clamp`; splits en 1 columna bajo 768px; controles fijos no bloquean contenido. Ver [`responsive-contract.md`](responsive-contract.md).

**No** hardcodear colores de cliente en el framework base.

## Tipografía

- `--deck-font-display` — títulos (H1, H2)
- `--deck-font-body` — body, labels, contador

Cargar desde Google Fonts, self-hosted o system stack según manual de marca.

## Navegación

- Flechas ← →, Espacio, clic izq/der
- F11 pantalla completa
- Contador `N / total`
- Videos: play solo en slide activa; pause al salir
- Lightbox en galería; Escape cierra

## Anti-slop

- No copiar copy de propuestas reales en el template base
- No usar assets de cliente en previews del repo
- Placeholders genéricos en español
- Tema oscuro o claro — uno solo, definido en manual de marca
