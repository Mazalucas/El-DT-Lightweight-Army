# Framework — Slide deck HTML (fullscreen)

**ID:** `slide-deck-html`  
**Tipo:** framework de presentación (no design system)  
**Superficie compartida:** [`shared/surface-slide-deck.md`](../shared/surface-slide-deck.md)

Presentación pantalla completa con navegación por teclado/clic, optimizada para pitch comercial en vivo o export a PDF vía print.

## Cuándo usar

| Formato | Usar |
|---------|------|
| Pitch en vivo, F11, proyector | **Este framework** |
| Reporte scroll, envío por link/email | `surface-presentation.md` + design system |
| Google Slides / Keynote | Spec desde este framework + manual de marca |

## Gate: manual de marca (obligatorio)

**Detener** si el operador no compartió al menos:

1. Logo (SVG/PNG) o wordmark
2. Paleta primaria + acento + neutros
3. Tipografías display y body
4. Tono (formal / expresivo / técnico)
5. Restricciones (colores prohibidos, uso de fotos, etc.)

Registrar en `.agents/design-context.md` → sección **Brand manual**. Si no hay manual formal, completar checklist en `design-context/references/brand-manual-checklist.md` vía `/atelier init`.

## Implementación

1. Leer `shared/surface-slide-deck.md` (estructura de slides).
2. Aplicar tokens: `frameworks/slide-deck-html/tokens.css` mapeados desde manual de marca.
3. Implementar el deck directamente en el proyecto activo (no en esta librería base).
4. Copy: placeholders de `shared/placeholders.md` § Slide deck.
5. Validar con `anti-slop` + `./scripts/dt-design-detect.sh` sobre el HTML entregado.

## Estructura HTML

```text
<!DOCTYPE html>
<html lang="es">
  <head> — meta, fonts del manual, tokens.css inline o link </head>
  <body>
    [logo fijo] [contador] [hint] [branding footer]
    <section class="slide …" data-slide="N">
      [slide-bg opcional]
      <div class="slide-content[--wide]"> … contenido centrado … </div>
    </section> × N
    [lightbox opcional]
    <script> — navegación, video playback, lightbox </script>
  </body>
</html>
```

## Clases CSS canónicas

Copiar del preview base; adaptar colores vía variables `--deck-*`:

- `.slide` / `.slide.active` — visibilidad y transición; `align-items: center`
- `.slide-content` — **contenedor centrado** (max-width 900px, text-align center)
- `.slide-content--wide` — max-width 1100px para splits y galería
- `.slide-brief` — slides con label + H2 + content dentro de `.slide-content`
- `.brief-label` — kicker uppercase accent, centrado
- `.slide-solucion-video` — video + texto lado a lado (bloque centrado)
- `.slide-datos` + `.datos-grid` — métricas en cards centradas
- `.slide-gallery` — grid imágenes + lightbox
- `.slide-bg-placeholder` — fondo decorativo (absolute, z-index 0)
- `.accent` — énfasis inline

**Regla:** todo contenido visible va dentro de `.slide-content`; no colocar label/h2 sueltos como hijos directos de `.slide`.

## Script de navegación (comportamiento requerido)

- `showSlide(n)` con wrap circular
- Keydown: ArrowRight, Space → next; ArrowLeft → prev
- Click: mitad derecha → next; izquierda → prev
- Videos `playsinline muted loop`: play en slide activa, pause al salir
- Lightbox: click imagen galería → fullscreen; Escape o click overlay → cerrar
- Excluir navegación al clic en galería/lightbox

## Slides por defecto (placeholders)

| # | Patrón | Placeholders |
|---|--------|--------------|
| 1 | Portada | `{brand}`, `{deck_subtitle}` |
| 2 | Contexto + video | `{section_label}`, `{context_title}`, `{context_body}` |
| 3 | Problema | `{problem_title}`, `{problem}` |
| 4 | Datos | `{stats_title}`, grid `{stat_n}` / `{stat_n_label}` |
| 5 | Mercado | `{market_title}`, `{market_body}` |
| 6 | Solución + video | `{solution_title}`, `{solution_body}` |
| 7 | Galería | `{proposal_title}`, `{proposal_subtitle}`, imágenes |
| 8 | Compromiso | `{commitment_title}`, `{commitment_body}` |
| 9 | Entregables | `{deliverables_title}`, `{deliverables_body}` |
| 10 | Partner | `{partner_title}`, logo `{partner_logo}` |
| 11 | Cierre | `{closing_title}`, `{closing_contact}` |

## Combinar con design system

Opcional: aplicar reglas tipográficas o componentes de un DS (`systems/{id}/`) **solo** en tokens y espaciado — el framework de navegación y layouts permanece.

## Anti-slop

- No incluir datos, nombres de clientes ni assets reales en el template del repo
- No duplicar colores de una propuesta específica como default del framework
- Un acento, un tema (oscuro o claro)
- **Contraste:** pares obligatorios en [`shared/contrast-contract.md`](../shared/contrast-contract.md) — nunca texto oscuro sobre `--deck-bg` oscuro
