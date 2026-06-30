# Landing starter — copy to active project

Scaffold mínimo. Aplicar tokens del design system elegido vía `/atelier select`.

## Estructura sugerida

```text
src/
  components/landing/
    Hero.tsx
    Features.tsx
    CTA.tsx
  pages/index.tsx   # o app/page.tsx (Next)
  styles/landing.css
```

## Hero (wireframe)

- Headline: `{{PRODUCT_NAME}}` — one-liner from design-context
- Subhead: primary user job-to-be-done
- Primary CTA + secondary link
- No purple gradient; use brand primary from tokens

## Checklist post-scaffold

1. Replace placeholders (`templates/shared/placeholders.md`)
2. `./scripts/atelier-detect.sh src/`
3. Responsive: 375 / 768 / 1024 / 1440
