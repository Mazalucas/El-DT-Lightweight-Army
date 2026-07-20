---
name: system-templates
description: "When applying Atelier templates for a design system — homepage, pitch/report presentation, SaaS dashboard. Use after design-selector recommends material-design, apple-hig, fluent-design, carbon-design, polaris-design, or atlassian-design. Markdown-only: read specs and implement in the project stack. Triggers: 'system template,' 'Material template,' 'Carbon dashboard template,' 'Tu nuevo negocio' placeholders."
metadata:
  version: 2.0.0
---

# System Templates

Plantillas canónicas por **design system**. Fuente de verdad: **archivos Markdown** — la IA lee e implementa; **no** ejecuta scripts ni regenera HTML.

## Protocolo obligatorio

Leer primero: [`templates/PROTOCOL.md`](../templates/PROTOCOL.md)

## Superficies (×6 systems)

| Superficie | Archivo system | Spec compartida |
|------------|----------------|-----------------|
| Homepage producto + servicio | `homepage.md` | `templates/shared/surface-homepage.md` |
| Presentación pitch / reporte | `presentation.md` | `templates/shared/surface-presentation.md` |
| Dashboard SaaS | `dashboard-saas.md` | `templates/shared/surface-dashboard.md` |

Copy en español: [`templates/shared/placeholders.md`](../templates/shared/placeholders.md)

## Workflow (IA)

1. Confirmar `system-id` desde `dt-design-select` o brief.
2. Abrir **solo** `templates/systems/{system-id}/` — nunca los 6 a la vez.
3. Para la superficie pedida, leer el `.md` del system **+** el `surface-*.md` shared **+** placeholders.
4. Implementar en el stack del proyecto (React, Vue, HTML, Figma spec, etc.) siguiendo wireframes y paleta del `.md`.
5. Skill profundo del DS: `design/systems/{system-id}/GUIDE.md`.
6. Overlay visual opcional: skill `style-templates` (una carpeta `styles/`).
7. Pre-entrega: `anti-slop` + `dt-design-detect` sobre **código entregado**.

## Qué NO hacer

- No `ruby scripts/generate-atelier-previews.rb`
- No `./scripts/atelier-templates-preview.sh` como paso del skill
- No usar `preview/pages/*.html` como fuente canónica (legacy humano)
- No mezclar tokens de dos systems en una vista

## Paths

| Recurso | Path |
|---------|------|
| Protocolo | `.cursor/skills/design/templates/PROTOCOL.md` |
| Systems | `.cursor/skills/design/templates/systems/{system-id}/` |
| Placeholders | `.cursor/skills/design/templates/shared/placeholders.md` |
| Registro (routing) | `vitals/data/design/template-registry.yaml` |

## Reglas

- Ecosystem lock: Shopify → polaris; Atlassian → atlassian; Microsoft → fluent; etc.
- Tres superficies = **tres estructuras distintas** (landing · pitch scroll · dashboard app).
- `accent-dark` en paleta = acento legible sobre fondos oscuros del pitch.

## Related Skills

- **design-selector** — elige system
- **style-templates** — overlay visual secundario (también Markdown)
- **systems/** — criterios profundos del DS
