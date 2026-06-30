# Superficie — Homepage (producto + servicio)

**Tipo:** marketing landing. **No** usar estructura de propuesta scroll ni layout de dashboard.

Placeholders: [`placeholders.md`](placeholders.md) · Protocolo: [`../PROTOCOL.md`](../PROTOCOL.md)

## Wireframe

```text
┌─────────────────────────────────────────────────────────────┐
│ [brand]     Nav links …                    [cta_secondary] [cta_primary] │ sticky
├─────────────────────────────────────────────────────────────┤
│ tagline chip · headline · subhead · [primary] [secondary]   │ hero 60/40
│                                    │ product visual / mock  │
├─────────────────────────────────────────────────────────────┤
│ "Por qué {brand}" · 3 feature cards (asimétrico o grid)   │
├─────────────────────────────────────────────────────────────┤
│ 4 métricas en fila (tabular nums, acento en valor)          │
├─────────────────────────────────────────────────────────────┤
│ CTA band: headline + cta_primary                            │
├─────────────────────────────────────────────────────────────┤
│ footer mínimo                                               │
└─────────────────────────────────────────────────────────────┘
```

## Secciones (implementar en este orden)

### 1. Nav sticky
- Logo = `{brand}`.
- Links: Producto, Servicio, Precios, Nosotros, Contacto (ver placeholders).
- Acciones: secundaria (outline) + primaria (filled).
- Altura ~64–72px; borde inferior sutil; fondo surface con blur opcional **≤30%** de la UI.

### 2. Hero
- Grid **1.1fr / 0.9fr** (texto izquierda, visual derecha).
- Chip/tag con `{tagline}`.
- H1 `{headline}` — `clamp(2.1rem, 4.6vw, 3.4rem)`, max ~18ch, `text-wrap: balance`.
- Lead `{subhead}` — max ~52ch, color muted.
- Dos CTAs: `{cta_primary}` filled, `{cta_secondary}` outline o link.
- Visual derecho: placeholder de producto (`{product}`) — borde, radius del DS, sombra suave; **sin** gradiente purple AI.

### 3. Features
- Título: "Por qué {brand}".
- Subtítulo: `{tagline}`.
- **3 cards** con títulos/cuerpos de placeholders — preferir grid 2+1 o bento, **no** tres columnas idénticas centradas con icon tile genérico.

### 4. Métricas
- 4 KPIs en fila (responsive: 2×2 en mobile).
- Valores con `font-variant-numeric: tabular-nums`; color acento en el número.

### 5. CTA band
- Fondo acento o gradiente **del brand** (no purple mesh).
- Título + `{cta_primary}` con contraste AA.

## Accesibilidad y calidad

- **Contraste:** fondo claro → texto oscuro; CTA filled → `--tpl-on-primary`. Ver [`contrast-contract.md`](contrast-contract.md).
- **Responsive:** burger + drawer en mobile; hero 1 col; KPIs 2×2 o snap. Ver [`responsive-contract.md`](responsive-contract.md).
- `:focus-visible` con ring de acento en links y botones.
- Touch targets ≥44px.
- Inputs de búsqueda (si hay): `type="search"` + `aria-label`.
- Tipografía del design system (ver `.md` del system); evitar Inter genérico salvo Polaris u excepción documentada.

## Anti-slop

- No clonar pitch scroll en homepage.
- No `#000` puro — ink tintado del system.
- No hero centrado + blob gradient + 3 columnas iguales.
