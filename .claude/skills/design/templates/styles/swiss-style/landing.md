> **IA:** implementá desde este Markdown — [`../../PROTOCOL.md`](../../PROTOCOL.md). No ejecutes scripts de preview.

# Swiss Style — Landing Template

**Dials sugeridos:** V=4, M=3, D=5 · **Tokens:** `tokens.css`

## Layout (12-col grid)

```text
┌──────────────────────────────────────────────────────────────┐
│ LOGO          Nav    Nav    Nav                    [CTA btn] │  row 1–2
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Headline (cols 1–7)              │  Image or data (8–12)   │  asymmetric 60/40
│  Subhead measure ≤65ch            │  objective, no blob       │
│  [ Primary ]  [ Secondary link ]  │                          │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  Section label (caps, tracking-wide)                         │
│  ┌──────────┬──────────┬──────────┬──────────┐               │  4-col facts or metrics
│  │ KPI      │ KPI      │ KPI      │ KPI      │               │
│  └──────────┴──────────┴──────────┴──────────┘               │
├──────────────────────────────────────────────────────────────┤
│  Two-column editorial (7/5) — text left, supporting right    │
├──────────────────────────────────────────────────────────────┤
│  Footer: links in single row, small caps meta                 │
└──────────────────────────────────────────────────────────────┘
```

## Reglas

| Elemento | Spec |
|----------|------|
| Hero | Asimétrico; **no** centrar 3 columnas iguales |
| Tipografía | Jerarquía por tamaño/peso; color solo para acento |
| Color | 1 acento + neutros; sin gradientes |
| Imágenes | Objetivas o omitir; sin ilustración decorativa genérica |
| CTA | Rectangular, radius 0–2px; borde 1px opcional en secondary |
| Spacing | Múltiplos de 8px; secciones 64–96px |

## Componentes

- **Nav:** texto plano, underline on hover, sin pills
- **Cards:** borde 1px, sin sombra; o lista con divisores
- **Testimonial:** comillas tipográficas, nombre en semibold

## Anti-patterns (este estilo)

- Glass, neumorphism, purple gradients
- Icon tile redondo sobre cada heading
- Inter sin justificación de marca

## Combinar con

- `systems/carbon-design` — enterprise
- `ui-templates` — estructura auth/dashboard encima de estos tokens
