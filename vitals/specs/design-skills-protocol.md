---
id: SPEC-DESIGN-001
title: Protocolo de skills Atelier
type: policy
status: canonical
owner: dt-platform
updated: 2026-11-10
summary: Routing, handoffs y precedencia del pack design vs marketing y frontend.
---

# Protocolo de skills Atelier

## Cuándo invocar

El DT o **ui-designer** cuando el pedido incluya: UI, UX, landing, dashboard, mockup, design system, estética, componentes visuales, tokens, presentación/deck.

Sugerir proactivamente: `/atelier init` si falta `.agents/design-context.md`; `/atelier select` si el brief es ambiguo.

## Contexto de diseño — criterio único

Fuente normativa. Skills, overlays y docs enlazan acá; no redefinen.

| Qué | Dónde | Git |
|-----|-------|-----|
| Contexto de diseño del proyecto | `.agents/design-context.md` (**única** ruta canónica) | **Local**: `.gitignore` + `private_exact` de `canonical-publish.yaml` |
| Contexto de marketing (se importa, no se duplica) | `.agents/product-marketing.md` | **Local**: igual que arriba |
| Formato (campos y secciones) | [`context-schema.md`](../../.cursor/skills/design/design-context/references/context-schema.md) | Versionado |
| Este criterio | esta sección | Versionado |

1. **Quién lo escribe:** `/atelier init` (skill `design-context`) lo crea; `/atelier document` lo actualiza desde el código. Requiere sesión `/yo`. Las demás skills solo lo leen.
2. **Una sola ruta.** No hay rutas legacy: `.claude/design-context.md` no se lee (queda en `.gitignore` solo como red). No crear `PRODUCT.md` / `DESIGN.md` salvo export explícito para herramientas externas (secundario, no canónico).
3. **Formato:** frontmatter obligatorio `version`, `updated`, `product`, `register` (`brand` | `product`). Sección **Anti-patterns** siempre presente. **Brand manual** obligatorio solo antes de decks.
4. **Dials V/M/D:** **V** densidad visual · **M** movimiento · **D** profundidad (1–5). Calibración: skill `design-read`.
5. **El repo del DT no tiene contexto de diseño propio.** El framework versiona el formato y este criterio; cada proyecto escribe el suyo. En el checkout oficial, `dt-publish-gate.sh` bloquea publicarlo.


## Precedencia

1. `vitals/specs/precedence.md` (seguridad, sesión `/yo`)
2. Ecosystem lock-in (decision-matrix.yaml)
3. `.agents/design-context.md` → sección **Anti-patterns** (exclusiones explícitas del proyecto)
4. Salida de dt-design-select (incluye paths `TEMPLATE`)
5. Skill táctica única

## Style templates

Tras el selector, cargar **style-templates** — una carpeta bajo `design/templates/styles/{style-id}/`:

- Fuente canónica: **archivos `.md`** (wireframes, reglas, anti-patterns). La IA implementa en el stack del proyecto.
- Protocolo: `templates/PROTOCOL.md` — **no** ejecutar scripts de generación HTML.
- Combinar con `ui-templates` para estructura agnóstica.
- Registro: `DOC-REF-003`, `vitals/data/design/template-registry.yaml`.
- **Nunca** cargar las cinco carpetas de estilo en un mismo turno.

## System templates

Misma regla Markdown-only: `templates/systems/{id}/` + `templates/shared/surface-*.md` + `shared/placeholders.md`.

## Handoffs

| Desde | Hacia | Cuándo |
|-------|-------|--------|
| ui-designer | frontend | Implementación de código |
| ui-designer | brand-guardian | Brand guidelines existentes |
| ui-designer | content-creator | Copy/marketing (no specs visuales) |
| atelier | ui-designer | Specs complejas |

## vs Marketing

- **product-marketing.md** — posicionamiento, copy, canales
- **design-context.md** — producto + diseño + dials V/M/D + Anti-patterns (importa marketing si existe; ver § Contexto de diseño)
- No duplicar semántica; marketing-strategist no reemplaza ui-designer

## Anti-contexto

- No cargar `vitals/data/design/` completo en chat
- No leer más de un SKILL.md táctico por turno salvo router atelier
- Usar scripts para recomendación compacta

## Verificación

- `./scripts/atelier-detect.sh` antes de entregar UI (Impeccable CLI)
- `./scripts/dt-doctor.sh` tras cambios estructurales al pack
- `./tools/atelier/scripts/sync-from-impeccable.sh` tras bump upstream Impeccable
