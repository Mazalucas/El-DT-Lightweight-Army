# Brand manual — checklist mínimo (presentaciones)

Usar cuando el operador **no tiene** manual de marca formal pero necesita generar una presentación (slide deck HTML, scroll pitch, Keynote spec).

## Gate

El DT/Atelier **no genera** la presentación hasta completar este checklist o recibir un PDF/guía de marca.

## Checklist (entrevista rápida)

### Identidad

- [ ] Nombre de marca / producto
- [ ] Logo (archivo o descripción del wordmark)
- [ ] Tagline opcional

### Color

- [ ] Color primario (hex)
- [ ] Color acento / énfasis (hex)
- [ ] Fondo preferido (oscuro / claro / mixto)
- [ ] Neutros para texto secundario
- [ ] Colores **prohibidos** (si aplica)

### Tipografía

- [ ] Fuente display (títulos)
- [ ] Fuente body (párrafos)
- [ ] URL Google Fonts o archivos self-hosted

### Tono y restricciones

- [ ] Tono: formal / expresivo / técnico / cercano
- [ ] Uso de fotos vs ilustración vs iconografía
- [ ] Restricciones legales (confidencialidad, disclaimers)

### Assets opcionales

- [ ] Imágenes de producto / mockups
- [ ] Videos (URLs o archivos)
- [ ] Logos de partners

## Dónde registrar

Guardar respuestas en `.agents/design-context.md`:

```markdown
## Brand manual

| Campo | Valor |
|-------|-------|
| Logo | … |
| Primario | #… |
| Acento | #… |
| Display font | … |
| Body font | … |
| Tono | … |
| Restricciones | … |

Fuente: [manual PDF / entrevista YYYY-MM-DD]
```

Mapear a tokens:

- Slide deck HTML → `frameworks/slide-deck-html/tokens.css` (`--deck-*`)
- Scroll pitch → tokens del design system elegido

## Si el operador no puede completar

Ofrecer:

1. **Opción A:** `/atelier init` — entrevista guiada y guardar en design-context
2. **Opción B:** Usar design system Atelier default (Material, Carbon, etc.) con placeholders neutros — **documentar** que falta marca real
3. **Opción C:** Posponer generación hasta recibir manual

No inventar paleta de un cliente conocido ni copiar estilos de propuestas confidenciales compartidas como referencia estructural.
