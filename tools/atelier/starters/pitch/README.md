# Pitch starter · slide-deck-html

Plantilla canónica de pitch DT en preview:

**`tools/atelier/preview/demos/pitch-dt.html`**

## Qué incluye

- 11 slides (portada → cierre) según `frameworks/slide-deck-html/presentation.md`
- Un solo archivo HTML: CSS + JS inline, compartible por email o drive
- Navegación: flechas, espacio, clic izq/der, dots, progress bar
- Transiciones slide + stagger en contenido
- Galería con lightbox
- Tokens Atelier (Cormorant + DM Sans, acento gold)

## Uso

1. Copiar `pitch-dt.html` al proyecto activo
2. Reemplazar copy y métricas desde `.agents/design-context.md`
3. Mapear paleta del manual de marca a variables `--deck-*`
4. Presentar en F11 fullscreen

## Preview local

```bash
./tools/atelier/scripts/serve-preview.sh
```

Abrir `demos/pitch-dt.html` desde el hub.

## Comando Atelier

```text
/atelier deck --scaffold pitch
```

Ver skill `slide-deck-html` y `presentation-decks`.
