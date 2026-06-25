---
id: DOC-GUIDE-005
title: Setup y uso de Atelier
type: guide
status: canonical
owner: dt-platform
created: 2026-06-13
updated: 2026-06-25
tags:
  - design
  - atelier
  - guide
summary: Cómo iniciar contexto, craft UI, detectar slop (Impeccable CLI) y sincronizar vendor.
related:
  - DOC-DESIGN-001
  - DOC-REF-002
  - DOC-REF-003
  - DOC-REF-004
  - DOC-REF-008
  - DOC-GUIDE-008
priority: high
source_of_truth: true
---

# Setup y uso de Atelier

## Ritual recomendado

```text
/atelier init → /atelier select "brief" → /atelier craft <surface> → /atelier detect
```

Craft escribe código UI directamente (stack web default). Frontend interviene para integración backend/E2E.

## 1. Contexto unificado

`/atelier init` ejecuta la skill `design-context` y crea `.agents/design-context.md`.

Si existe `.agents/product-marketing.md`, se importa la sección de producto — no duplicar.

## 2. Selección de design system

```bash
ruby scripts/dt-design-select.rb "fintech dashboard B2B"
ruby scripts/dt-design-select.rb "beauty spa landing" --format markdown -p "Serenity Spa"
```

O `/atelier select` con el brief en el chat.

La salida incluye paths **`TEMPLATE`** — cargar esos archivos vía skill **`style-templates`** antes de diseñar (ver [Registro de templates](../03_reference/style-templates-registry.md), `DOC-REF-003`).

## 3. Templates de estilo

Tras el selector:

1. Abrir `.cursor/skills/design/templates/styles/{style-id}/` (solo **un** estilo).
2. Copiar/adaptar `tokens.css` al proyecto.
3. Elegir superficie: `landing.md`, `product-shell.md`, o extra (`auth`, `controls`, `nav-overlay`).
Ver índice completo: [atelier-templates-index.md](../03_reference/atelier-templates-index.md) (`DOC-REF-004`).

**Implementación:** generar la UI final en el directorio del proyecto activo usando las specs Markdown del template elegido.

## 4. Anti-slop determinístico (Impeccable CLI)

```bash
./scripts/atelier-detect.sh src/
./scripts/atelier-detect.sh --json .
```

Instalación CLI (primera vez): `cd tools/atelier && npm install`

Maintainers: `/atelier actualizar` o ver [atelier-impeccable-sync.md](atelier-impeccable-sync.md) (`DOC-GUIDE-008`).

## 5. Preview demo (humano)

Showcase local al estilo [impeccable.style](https://impeccable.style/): before/after slop vs craft, vocabulario de 23 comandos, mock live/detect y demos navegables.

```bash
./tools/atelier/scripts/serve-preview.sh
```

| Página | Qué muestra |
|--------|-------------|
| `index.html` | Hub: compare tabs, comandos, terminal detect, catálogo demos |
| `demos/pitch-dt.html` | **Pitch standalone** · 11 slides · F11 · animaciones · lightbox |
| `demos/landing-coastal.html` | Landing hotel completa (suites, dining, spa, footer) |
| `demos/slop-before.html` | Fixture slop intencional (para `atelier-detect --no-config`) |
| `demos/dashboard-product.html` | Product shell con KPIs, chart, projects, activity |

Starter pitch: `tools/atelier/starters/pitch/README.md`

URL: `http://127.0.0.1:8765/`

## 5. MCP 21st.dev (opcional)

Para componentes aislados con variaciones:

```bash
npx @21st-dev/cli@latest install cursor --api-key YOUR_API_KEY
```

Ver skill `component-variations` y `references/21st-dev-mcp.md`. **No commitear API keys.**

## 5. Multi-IDE

Fuente canónica: `.cursor/skills/design/`. Tras editar:

```bash
./scripts/sync-skills-parity.sh
./scripts/sync-ide.sh
```

## Related docs

- [Concepto Atelier](../01_concepts/design-atelier-el-dt.md) (`DOC-DESIGN-001`)
