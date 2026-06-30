# Índice de plantillas Atelier

> **Contrato IA:** [PROTOCOL.md](PROTOCOL.md) — Markdown-only; no scripts de generación.

> **Índice docs:** [`docs/03_reference/atelier-templates-index.md`](../../../../docs/03_reference/atelier-templates-index.md) (`DOC-REF-004`)

> **Sin galería versionada:** esta librería mantiene base en Markdown/tokens; los outputs visuales se generan en el proyecto activo.

Abrir **un estilo o un system a la vez**. No cargar todas las carpetas en el mismo turno.

## Design systems · `systems/{id}/`

Cada system: `homepage.md` · `presentation.md` · `dashboard-saas.md` + specs shared en [`shared/`](shared/).

| System | Homepage | Pitch | Dashboard |
|--------|----------|-------|-----------|
| Material M3 Expressive | [material-design/homepage.md](systems/material-design/homepage.md) | [presentation](systems/material-design/presentation.md) | [dashboard](systems/material-design/dashboard-saas.md) |
| Apple HIG | [apple-hig/homepage.md](systems/apple-hig/homepage.md) | [presentation](systems/apple-hig/presentation.md) | [dashboard](systems/apple-hig/dashboard-saas.md) |
| Fluent 2 | [fluent-design/homepage.md](systems/fluent-design/homepage.md) | [presentation](systems/fluent-design/presentation.md) | [dashboard](systems/fluent-design/dashboard-saas.md) |
| IBM Carbon | [carbon-design/homepage.md](systems/carbon-design/homepage.md) | [presentation](systems/carbon-design/presentation.md) | [dashboard](systems/carbon-design/dashboard-saas.md) |
| Shopify Polaris | [polaris-design/homepage.md](systems/polaris-design/homepage.md) | [presentation](systems/polaris-design/presentation.md) | [dashboard](systems/polaris-design/dashboard-saas.md) |
| Atlassian | [atlassian-design/homepage.md](systems/atlassian-design/homepage.md) | [presentation](systems/atlassian-design/presentation.md) | [dashboard](systems/atlassian-design/dashboard-saas.md) |

Specs compartidas: [placeholders](shared/placeholders.md) · [homepage](shared/surface-homepage.md) · [pitch scroll](shared/surface-presentation.md) · [slide deck HTML](shared/surface-slide-deck.md) · [dashboard](shared/surface-dashboard.md)

---

## Framework · `frameworks/slide-deck-html/`

Presentación fullscreen con navegación teclado/clic. **Requiere manual de marca** antes de generar.

| Archivo | Abrir |
|---------|-------|
| `presentation.md` | [frameworks/slide-deck-html/presentation.md](frameworks/slide-deck-html/presentation.md) |
| `tokens.css` | [frameworks/slide-deck-html/tokens.css](frameworks/slide-deck-html/tokens.css) |
| Skill | [../frameworks/slide-deck-html/SKILL.md](../frameworks/slide-deck-html/SKILL.md) |

---

## Swiss Style · `styles/swiss-style/`

| Archivo | Abrir |
|---------|-------|
| `tokens.css` | [styles/swiss-style/tokens.css](styles/swiss-style/tokens.css) |
| `landing.md` | [styles/swiss-style/landing.md](styles/swiss-style/landing.md) |
| `product-shell.md` | [styles/swiss-style/product-shell.md](styles/swiss-style/product-shell.md) |

---

## Bauhaus Style · `styles/bauhaus-style/`

| Archivo | Abrir |
|---------|-------|
| `tokens.css` | [styles/bauhaus-style/tokens.css](styles/bauhaus-style/tokens.css) |
| `landing.md` | [styles/bauhaus-style/landing.md](styles/bauhaus-style/landing.md) |
| `product-shell.md` | [styles/bauhaus-style/product-shell.md](styles/bauhaus-style/product-shell.md) |

---

## Digital Minimalism · `styles/digital-minimalism/`

| Archivo | Abrir |
|---------|-------|
| `tokens.css` | [styles/digital-minimalism/tokens.css](styles/digital-minimalism/tokens.css) |
| `landing.md` | [styles/digital-minimalism/landing.md](styles/digital-minimalism/landing.md) |
| `product-shell.md` | [styles/digital-minimalism/product-shell.md](styles/digital-minimalism/product-shell.md) |
| `auth.md` | [styles/digital-minimalism/auth.md](styles/digital-minimalism/auth.md) |

---

## Neumorphism (≤20% UI) · `styles/neumorphism/`

| Archivo | Abrir |
|---------|-------|
| `tokens.css` | [styles/neumorphism/tokens.css](styles/neumorphism/tokens.css) |
| `controls.md` | [styles/neumorphism/controls.md](styles/neumorphism/controls.md) |
| `product-shell.md` | [styles/neumorphism/product-shell.md](styles/neumorphism/product-shell.md) |

---

## Glassmorphism (≤30% UI) · `styles/glassmorphism/`

| Archivo | Abrir |
|---------|-------|
| `tokens.css` | [styles/glassmorphism/tokens.css](styles/glassmorphism/tokens.css) |
| `landing.md` | [styles/glassmorphism/landing.md](styles/glassmorphism/landing.md) |
| `product-shell.md` | [styles/glassmorphism/product-shell.md](styles/glassmorphism/product-shell.md) |
| `nav-overlay.md` | [styles/glassmorphism/nav-overlay.md](styles/glassmorphism/nav-overlay.md) |

---

## Layout agnóstico · `ui-templates/references/templates/`

| Archivo | Abrir |
|---------|-------|
| `auth-minimal.md` | [../ui-templates/references/templates/auth-minimal.md](../ui-templates/references/templates/auth-minimal.md) |
| `dashboard-analytics.md` | [../ui-templates/references/templates/dashboard-analytics.md](../ui-templates/references/templates/dashboard-analytics.md) |

---

## Registro

- [registry.yaml](registry.yaml) — paths relativos
- [vitals/data/design/template-registry.yaml](../../../../vitals/data/design/template-registry.yaml) — metadatos + cuotas
