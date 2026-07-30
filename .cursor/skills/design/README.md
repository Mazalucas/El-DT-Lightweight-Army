# Atelier Design Pack (El DT)

Skills de diseño para el subagente **ui-designer**, organizadas por fases. Inspiradas en [ui-ux-pro-max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill), [Impeccable](https://github.com/impeccable-ai/impeccable) y [taste-skill](https://github.com/anthropics/taste-skill) — adaptadas al pipeline DT con contexto unificado, selector determinístico y guardrails anti-slop.

## Uso

1. **Fase 0:** `design-context` → `.agents/design-context.md` (importa `product-marketing.md` si existe).
2. **Fase 0:** `design-selector` invoca `ruby scripts/dt-design-select.rb` con el brief.
3. **Fase 0:** `design-read` — one-liner + 3 dials (V/M/D) antes de diseñar.
4. **Fase 1:** Cargar **system-templates** — leer `.md` del DS + `templates/shared/surface-*.md` e **implementar** en el stack (Markdown-only, ver [`templates/PROTOCOL.md`](templates/PROTOCOL.md)).
5. **Fase 1b:** Overlay visual opcional con **style-templates** (wireframes `.md` del estilo).
6. **Fase 2–4:** Patterns + skills transversales según superficie.
7. **Pre-entrega:** `anti-slop` + `./scripts/atelier-detect.sh` sobre código entregado.

## Catálogo

| Skill | Fase | Triggers (resumen) |
|-------|------|-------------------|
| `design-context` | 0 | design context, `.agents/design-context.md`, dials, anti-patterns |
| `design-selector` | 0 | which design system, Atelier recommendation, dt-design-select |
| `design-read` | 0 | design read, V/M/D dials, taste check, one-liner |
| `anti-slop` | 0 | anti-slop, AI slop, purple gradient, dt-design-detect |
| `system-templates` | 1 | system template, homepage, dashboard SaaS, pitch — **Markdown-only** |
| `style-templates` | 1 | style overlay, wireframes `.md`, visual template |
| **Templates library** | | `.cursor/skills/design/templates/` — [INDEX.md](templates/INDEX.md) · [DOC-REF-004](../../../docs/03_reference/atelier-templates-index.md) |
| **Systems** | | |
| `systems/material-design` | 1 | Material 3, Android, MUI, Compose |
| `systems/apple-hig` | 1 | HIG, SwiftUI, iOS, SF Symbols |
| `systems/fluent-design` | 1 | Fluent 2, Microsoft 365, Teams |
| `systems/carbon-design` | 1 | IBM Carbon, enterprise, data-dense |
| `systems/polaris-design` | 1 | Shopify, merchant admin, checkout |
| `systems/atlassian-design` | 1 | Jira, Confluence, Forge, Atlaskit |
| **Styles** | | |
| `styles/swiss-style` | 1 | Swiss, International Typographic, grid |
| `styles/bauhaus-style` | 1 | Bauhaus, geometric, creative landing |
| `styles/digital-minimalism` | 1 | minimal SaaS, clean product UI |
| `styles/neumorphism` | 1 | soft UI, IoT toggles, partial neumorph |
| `styles/glassmorphism` | 1 | glass, backdrop blur, spatial UI |
| **Patterns** | | |
| `patterns/landing-patterns` | 2 | landing page, hero, conversion |
| `patterns/dashboard-patterns` | 2 | dashboard, analytics, admin |
| `patterns/auth-flows` | 2 | login, signup, auth, SSO |
| `patterns/presentation-decks` | 2 | pitch deck, slides, keynote |
| `frameworks/slide-deck-html` | 2 | HTML fullscreen deck, F11, propuesta comercial |
| **Transversal** | | |
| `ui-templates` | 2–4 | UI template, starter layout, auth/dashboard scaffold |
| `design-tokens` | 2–4 | design tokens, CSS variables, theme |
| `component-specs` | 2–4 | component spec, handoff, Figma-to-dev |
| `accessibility-design` | 2–4 | a11y, WCAG, contrast, focus |
| `responsive-layout` | 2–4 | responsive, breakpoints, mobile-first |
| `motion-design` | 2–4 | animation, motion, reduced-motion |
| `component-variations` | 2–4 | component variants, 21st.dev MCP |
| `presentation-design` | 2–4 | slide design, deck visuals, pitch aesthetic |

## Multi-IDE

| IDE | Ruta |
|-----|------|
| **Cursor** | `.cursor/skills/design/{skill}/` |
| **Antigravity** | `.agents/skills/design/{skill}/` |

Fuente canónica: **Cursor**. Tras editar, corré `./scripts/sync-skills-parity.sh`.

## Scripts

| Script | Uso |
|--------|-----|
| `ruby scripts/dt-design-select.rb "brief"` | Recomendación system + style + paths `.md` |
| `./scripts/atelier-detect.sh src/` | Impeccable CLI — detector anti-slop (44+ reglas) |
| `./scripts/dt-design-detect.sh` | Alias deprecated → atelier-detect |
| `./scripts/atelier-templates-preview.sh` | *(legacy humano)* galería HTML opcional |
| `ruby scripts/generate-atelier-previews.rb` | *(deprecated)* no usar desde skills |

Datos: `vitals/data/design/template-registry.yaml` · Specs IA: `design/templates/**/*.md` + [`PROTOCOL.md`](templates/PROTOCOL.md).

## Atribución

- **ui-ux-pro-max** — taxonomía de stacks y decisiones por industria.
- [Impeccable](https://github.com/pbakaus/impeccable) — 23 commands, CLI detect, hooks (vendoreado en `tools/atelier/`)
- **taste-skill** — Design Read (one-liner + V/M/D dials).
