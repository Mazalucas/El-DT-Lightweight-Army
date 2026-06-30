---
id: DOC-REF-003
title: Registro de templates de estilo Atelier
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
summary: Catálogo canónico de plantillas por lenguaje visual — paths, superficies, cuotas y reglas de carga para agentes.
related:
  - DOC-DESIGN-001
  - DOC-REF-002
  - DOC-REF-004
  - DOC-GUIDE-005
  - DOC-ARCH-002
priority: high
source_of_truth: true
---

# Registro de templates de estilo Atelier

Plantillas que el DT y **ui-designer** deben cargar **antes** de inventar UI. Una capa de *estética* (aquí) y otra de *estructura* (`ui-templates`).

## Fuentes

| Recurso | Path | Rol |
|---------|------|-----|
| Contenido | `.cursor/skills/design/templates/styles/{style-id}/` | tokens + layouts por estilo |
| Registro agente | `.cursor/skills/design/templates/registry.yaml` | paths relativos al pack |
| Registro datos | `vitals/data/design/template-registry.yaml` | metadatos + cuotas (scripts) |
| Skill router | `.cursor/skills/design/style-templates/SKILL.md` | workflow de carga |
| Índice humano | `.cursor/skills/design/templates/INDEX.md` | links rápidos en el pack |
| Índice docs | `docs/03_reference/atelier-templates-index.md` (`DOC-REF-004`) | tabla maestra navegable |

## Estilos registrados

| style-id | Superficies | Cuotas | Skill profundo |
|----------|-------------|--------|----------------|
| `swiss-style` | landing, product-shell | — | `styles/swiss-style` |
| `bauhaus-style` | landing, product-shell | — | `styles/bauhaus-style` |
| `digital-minimalism` | landing, product-shell, auth | glass ≤10% | `styles/digital-minimalism` |
| `neumorphism` | controls, product-shell | UI ≤20% | `styles/neumorphism` |
| `glassmorphism` | landing, product-shell, nav-overlay | UI ≤30% | `styles/glassmorphism` |

Alias en selector: `neumorphism-partial` → `neumorphism`.

## Archivos por carpeta

Cada estilo incluye al menos:

- **`tokens.css`** — variables semánticas (copiar/adaptar al proyecto).
- **`landing.md`** o **`product-shell.md`** — wireframe + reglas de composición.
- Extras según estilo: `auth.md`, `controls.md`, `nav-overlay.md`.

## Reglas de carga (agentes)

1. Obtener estilo desde `design-context.md` o `ruby scripts/dt-design-select.rb "brief"`.
2. Leer **solo** la carpeta del estilo recomendado — nunca las cinco a la vez.
3. Aplicar `tokens.css` → superficie (`landing` si surface=brand, else `product-shell`).
4. Si hace falta estructura agnóstica, combinar con `ui-templates/references/templates/` (estructura) + este pack (estética).
5. Declarar **Design Read** (`design-read`) con dials del registro.
6. Pre-entrega: `anti-slop` + `./scripts/dt-design-detect.sh`.

## Salida del selector

`dt-design-select` emite líneas `TEMPLATE {key}:` con paths bajo `.cursor/skills/design/templates/`. Abrir esos archivos antes de diseñar.

## vs layout templates

| Capa | Resuelve |
|------|----------|
| **Style templates** | Cómo se ve — color, tipo, sombras, límites anti-slop |
| **ui-templates** | Qué bloques — grid auth, sidebar dashboard, etc. |

Ejemplo: `ui-templates/auth-minimal` + `digital-minimalism/auth.md` + `tokens.css`.

## Verificación

- `./scripts/dt-doctor.sh` — valida carpetas, archivos del registro y skill `style-templates`.
- Tras editar templates: `./scripts/sync-skills-parity.sh`.

## Related docs

- [Índice de plantillas Atelier](atelier-templates-index.md) (`DOC-REF-004`) — abrir cada archivo
- [Matriz del selector Atelier](design-selector-matrix.md) (`DOC-REF-002`)
- [Atelier — concepto](../01_concepts/design-atelier-el-dt.md) (`DOC-DESIGN-001`)
- [Setup Atelier](../02_guides/atelier-setup.md) (`DOC-GUIDE-005`)
