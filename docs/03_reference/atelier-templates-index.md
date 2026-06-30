---
id: DOC-REF-004
title: Índice de plantillas Atelier
type: reference
status: canonical
owner: dt-platform
created: 2026-06-13
updated: 2026-06-13
tags:
  - design
  - reference
  - templates
  - atelier
  - index
summary: Índice navegable de todas las plantillas Atelier — estilo visual y layout — con enlace directo a cada archivo.
related:
  - DOC-REF-003
  - DOC-REF-002
  - DOC-GUIDE-005
  - DOC-DESIGN-001
priority: high
source_of_truth: true
---

# Índice de plantillas Atelier

Portal para **ver y abrir cada plantilla** del pack Atelier. Hay dos capas:

| Capa | Qué resuelve | Carpeta |
|------|--------------|---------|
| **Estilo visual** | Tokens, estética, wireframes con reglas del estilo | [`.cursor/skills/design/templates/styles/`](../../.cursor/skills/design/templates/styles/) |
| **Layout agnóstico** | Estructura (auth card, dashboard) sin estética fija | [`.cursor/skills/design/ui-templates/references/templates/`](../../.cursor/skills/design/ui-templates/references/templates/) |

**Registro machine-readable:** [`vitals/data/design/template-registry.yaml`](../../vitals/data/design/template-registry.yaml) · **Contrato:** [Registro de templates](style-templates-registry.md) (`DOC-REF-003`).

---

## Nota operativa

Las plantillas canónicas son Markdown + tokens. Los outputs HTML/React/Figma se generan en el directorio del proyecto activo, no en esta librería base.

---

## Tabla maestra (19 plantillas)

Clic en el nombre del archivo para abrirlo en el repo.

### Estilo visual — 17 archivos

| # | Estilo | Archivo | Tipo | Fuente |
|---|--------|---------|------|--------|
| 1 | Swiss | `tokens.css` | CSS tokens | [swiss-style/tokens.css](../../.cursor/skills/design/templates/styles/swiss-style/tokens.css) |
| 2 | Swiss | `landing.md` | Landing wireframe | [swiss-style/landing.md](../../.cursor/skills/design/templates/styles/swiss-style/landing.md) |
| 3 | Swiss | `product-shell.md` | App shell | [swiss-style/product-shell.md](../../.cursor/skills/design/templates/styles/swiss-style/product-shell.md) |
| 4 | Bauhaus | `tokens.css` | CSS tokens | [bauhaus-style/tokens.css](../../.cursor/skills/design/templates/styles/bauhaus-style/tokens.css) |
| 5 | Bauhaus | `landing.md` | Landing wireframe | [bauhaus-style/landing.md](../../.cursor/skills/design/templates/styles/bauhaus-style/landing.md) |
| 6 | Bauhaus | `product-shell.md` | App shell | [bauhaus-style/product-shell.md](../../.cursor/skills/design/templates/styles/bauhaus-style/product-shell.md) |
| 7 | Minimal | `tokens.css` | CSS tokens | [digital-minimalism/tokens.css](../../.cursor/skills/design/templates/styles/digital-minimalism/tokens.css) |
| 8 | Minimal | `landing.md` | Landing wireframe | [digital-minimalism/landing.md](../../.cursor/skills/design/templates/styles/digital-minimalism/landing.md) |
| 9 | Minimal | `product-shell.md` | App shell | [digital-minimalism/product-shell.md](../../.cursor/skills/design/templates/styles/digital-minimalism/product-shell.md) |
| 10 | Minimal | `auth.md` | Auth con estética minimal | [digital-minimalism/auth.md](../../.cursor/skills/design/templates/styles/digital-minimalism/auth.md) |
| 11 | Neumorphism | `tokens.css` | CSS tokens | [neumorphism/tokens.css](../../.cursor/skills/design/templates/styles/neumorphism/tokens.css) |
| 12 | Neumorphism | `controls.md` | Controles táctiles (≤20% UI) | [neumorphism/controls.md](../../.cursor/skills/design/templates/styles/neumorphism/controls.md) |
| 13 | Neumorphism | `product-shell.md` | Shell con controles parciales | [neumorphism/product-shell.md](../../.cursor/skills/design/templates/styles/neumorphism/product-shell.md) |
| 14 | Glass | `tokens.css` | CSS tokens | [glassmorphism/tokens.css](../../.cursor/skills/design/templates/styles/glassmorphism/tokens.css) |
| 15 | Glass | `landing.md` | Landing con materiales | [glassmorphism/landing.md](../../.cursor/skills/design/templates/styles/glassmorphism/landing.md) |
| 16 | Glass | `product-shell.md` | App shell translúcido | [glassmorphism/product-shell.md](../../.cursor/skills/design/templates/styles/glassmorphism/product-shell.md) |
| 17 | Glass | `nav-overlay.md` | Nav flotante / overlay (≤30% UI) | [glassmorphism/nav-overlay.md](../../.cursor/skills/design/templates/styles/glassmorphism/nav-overlay.md) |

### Layout agnóstico — 2 archivos

| # | Archivo | Superficie | Fuente |
|---|---------|------------|--------|
| 18 | `auth-minimal.md` | Login / signup (estructura) | [auth-minimal.md](../../.cursor/skills/design/ui-templates/references/templates/auth-minimal.md) |
| 19 | `dashboard-analytics.md` | Dashboard KPI + chart + table | [dashboard-analytics.md](../../.cursor/skills/design/ui-templates/references/templates/dashboard-analytics.md) |

---

## Por estilo visual

### 1. Swiss Style (`swiss-style`)

Grid tipográfico, jerarquía clara, decoración mínima. **Dials:** V=4, M=3, D=6.

| Plantilla | Descripción | Archivo |
|-----------|-------------|---------|
| Tokens | Paleta neutra, IBM Plex, grid 12 col, spacing 8px | [tokens.css](../../.cursor/skills/design/templates/styles/swiss-style/tokens.css) |
| Landing | Hero asimétrico 60/40, KPI row, editorial two-col | [landing.md](../../.cursor/skills/design/templates/styles/swiss-style/landing.md) |
| Product shell | Sidebar 240px, tabla densa, sin cards anidadas | [product-shell.md](../../.cursor/skills/design/templates/styles/swiss-style/product-shell.md) |

Skill profundo: [styles/swiss-style/SKILL.md](../../.cursor/skills/design/styles/swiss-style/SKILL.md)

---

### 2. Bauhaus Style (`bauhaus-style`)

Formas geométricas, primarios, composición audaz. **Dials:** V=7, M=5, D=4.

| Plantilla | Descripción | Archivo |
|-----------|-------------|---------|
| Tokens | Primarios rojo/amarillo/azul, formas circulares/cuadradas | [tokens.css](../../.cursor/skills/design/templates/styles/bauhaus-style/tokens.css) |
| Landing | Bloques geométricos, hero tipográfico, secciones modulares | [landing.md](../../.cursor/skills/design/templates/styles/bauhaus-style/landing.md) |
| Product shell | Nav con acentos geométricos, cards modulares | [product-shell.md](../../.cursor/skills/design/templates/styles/bauhaus-style/product-shell.md) |

Skill profundo: [styles/bauhaus-style/SKILL.md](../../.cursor/skills/design/styles/bauhaus-style/SKILL.md)

---

### 3. Digital Minimalism (`digital-minimalism`)

Product UI limpio, contenido primero. **Dials:** V=5, M=3, D=3 · **Slop risk:** alto.

| Plantilla | Descripción | Archivo |
|-----------|-------------|---------|
| Tokens | Neutros suaves, Geist/system, bordes sutiles | [tokens.css](../../.cursor/skills/design/templates/styles/digital-minimalism/tokens.css) |
| Landing | Hero centrado, social proof mínimo, CTA único | [landing.md](../../.cursor/skills/design/templates/styles/digital-minimalism/landing.md) |
| Product shell | Sidebar colapsable, content-first, poco chrome | [product-shell.md](../../.cursor/skills/design/templates/styles/digital-minimalism/product-shell.md) |
| Auth | Card centrada 400px, campos simples, SSO opcional | [auth.md](../../.cursor/skills/design/templates/styles/digital-minimalism/auth.md) |

Skill profundo: [styles/digital-minimalism/SKILL.md](../../.cursor/skills/design/styles/digital-minimalism/SKILL.md)

**Combinación típica:** [auth-minimal.md](../../.cursor/skills/design/ui-templates/references/templates/auth-minimal.md) (estructura) + [auth.md](../../.cursor/skills/design/templates/styles/digital-minimalism/auth.md) (estética).

---

### 4. Neumorphism (`neumorphism`) — parcial

Controles extruidos con sombras duales. **Cuota:** ≤20% de la UI.

| Plantilla | Descripción | Archivo |
|-----------|-------------|---------|
| Tokens | `--shadow-raised`, `--shadow-inset`, fondo base único | [tokens.css](../../.cursor/skills/design/templates/styles/neumorphism/tokens.css) |
| Controls | Toggles, sliders, botones soft — no formularios largos | [controls.md](../../.cursor/skills/design/templates/styles/neumorphism/controls.md) |
| Product shell | Dashboard IoT con panel de controles neumórficos | [product-shell.md](../../.cursor/skills/design/templates/styles/neumorphism/product-shell.md) |

Skill profundo: [styles/neumorphism/SKILL.md](../../.cursor/skills/design/styles/neumorphism/SKILL.md)

---

### 5. Glassmorphism (`glassmorphism`) — controlado

Blur, translucencia, chrome espacial. **Cuota:** ≤30% de la UI · requiere fondo rico.

| Plantilla | Descripción | Archivo |
|-----------|-------------|---------|
| Tokens | `--glass-bg`, `--blur-strength`, fallbacks opacos | [tokens.css](../../.cursor/skills/design/templates/styles/glassmorphism/tokens.css) |
| Landing | Hero sobre gradiente/imagen, cards flotantes | [landing.md](../../.cursor/skills/design/templates/styles/glassmorphism/landing.md) |
| Product shell | Sidebar glass, content opaco, toolbar flotante | [product-shell.md](../../.cursor/skills/design/templates/styles/glassmorphism/product-shell.md) |
| Nav overlay | Barra flotante, pills translúcidos, modal chrome | [nav-overlay.md](../../.cursor/skills/design/templates/styles/glassmorphism/nav-overlay.md) |

Skill profundo: [styles/glassmorphism/SKILL.md](../../.cursor/skills/design/styles/glassmorphism/SKILL.md)

---

## Layout agnóstico (ui-templates)

Sin tokens de estilo — combinar con cualquier carpeta `styles/{id}/`.

| Plantilla | Superficie | Archivo |
|-----------|------------|---------|
| Auth minimal | Card login 400px, email/password, SSO | [auth-minimal.md](../../.cursor/skills/design/ui-templates/references/templates/auth-minimal.md) |
| Dashboard analytics | KPI strip, chart 2/3, tabla, filtros | [dashboard-analytics.md](../../.cursor/skills/design/ui-templates/references/templates/dashboard-analytics.md) |

Skill: [ui-templates/SKILL.md](../../.cursor/skills/design/ui-templates/SKILL.md)

---

## Cómo elegir qué abrir

```text
1. ruby scripts/dt-design-select.rb "tu brief" --format markdown
2. Leer líneas TEMPLATE * → abrir esos paths
3. Si falta estructura → ui-templates
4. Si falta estética → style-templates (una carpeta)
```

## Índices relacionados

| Recurso | Path |
|---------|------|
| Índice en el pack (Cursor) | [`.cursor/skills/design/templates/INDEX.md`](../../.cursor/skills/design/templates/INDEX.md) |
| README del pack | [`.cursor/skills/design/templates/README.md`](../../.cursor/skills/design/templates/README.md) |
| Registro Atelier | [style-templates-registry.md](style-templates-registry.md) (`DOC-REF-003`) |
| Setup Atelier | [../02_guides/atelier-setup.md](../02_guides/atelier-setup.md) (`DOC-GUIDE-005`) |

## Related docs

- [Registro de templates de estilo Atelier](style-templates-registry.md) (`DOC-REF-003`)
- [Matriz del selector Atelier](design-selector-matrix.md) (`DOC-REF-002`)
