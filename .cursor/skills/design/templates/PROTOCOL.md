# Atelier — Protocolo de templates (solo Markdown)

**Contrato para IAs:** las plantillas Atelier son **instrucciones en Markdown**. La IA **lee, interpreta e implementa** en el stack del proyecto (React, HTML estático, Figma spec, etc.). **No** forma parte del workflow ejecutar scripts, regenerar HTML ni copiar archivos generados automáticamente.

## Inmutabilidad de base (obligatorio)

- La base canónica en `design/templates/**` (**.md**, tokens, protocolo) **no se modifica** salvo pedido explícito del usuario.
- Entregables de trabajo (templates, pitches, páginas, presentaciones, assets) se crean en el **directorio del proyecto activo** que se está construyendo, no en esta biblioteca base.
- Este repo mantiene **plantillas de instrucción**, no outputs finales por cliente.

## Qué leer (orden)

1. Este protocolo.
2. Placeholders: [`shared/placeholders.md`](shared/placeholders.md).
3. **Contraste (obligatorio):** [`shared/contrast-contract.md`](shared/contrast-contract.md) — pares fondo/texto en toda superficie.
4. **Responsive (obligatorio):** [`shared/responsive-contract.md`](shared/responsive-contract.md) — burger/drawer, grids, KPI snap, tablas scroll.
5. Superficie compartida:
   - Homepage → [`shared/surface-homepage.md`](shared/surface-homepage.md)
   - Presentación scroll / pitch → [`shared/surface-presentation.md`](shared/surface-presentation.md)
   - Presentación fullscreen HTML → [`shared/surface-slide-deck.md`](shared/surface-slide-deck.md) + [`frameworks/slide-deck-html/presentation.md`](frameworks/slide-deck-html/presentation.md)
   - Dashboard SaaS → [`shared/surface-dashboard.md`](shared/surface-dashboard.md)
6. **Un solo** design system: `systems/{system-id}/` (homepage · presentation · dashboard-saas).
7. **Opcional — framework slide deck:** `frameworks/slide-deck-html/` (navegación fullscreen; tokens desde manual de marca).
8. Skill profundo del DS: `systems/{system-id}/../SKILL.md` (carpeta `design/systems/`).
9. Overlay visual opcional: **una** carpeta `styles/{style-id}/` (skill `style-templates`).

## Qué NO hacer

- No invocar `ruby scripts/generate-atelier-previews.rb`.
- No invocar `./scripts/atelier-templates-preview.sh` como paso obligatorio.
- No crear ni versionar ejemplos HTML de cliente en `design/templates/preview/pages/`.
- No mezclar tokens de dos design systems en la misma vista.
- No cargar las 6 carpetas `systems/` ni las 5 `styles/` en un mismo turno.

## Gate presentaciones

Antes de implementar slide deck o pitch scroll: confirmar **manual de marca** en design-context o completar `design-context/references/brand-manual-checklist.md`.

## Cómo implementar

1. **Estructura** — seguir wireframes y secciones del `.md` de superficie + shared.
2. **Copy** — usar placeholders en español; reemplazar antes de producción.
3. **Color y tipo** — aplicar la tabla de paleta del `.md` del system (ink tintado, accent, accent-on-dark para fondos oscuros) + **pares de contraste** de [`contrast-contract.md`](shared/contrast-contract.md).
4. **Particularidades del DS** — respetar reglas del skill `systems/{id}/` (shape, motion, componentes).
5. **Validación** — skill `anti-slop` + `./scripts/atelier-detect.sh` sobre el código entregado (no sobre templates del repo).

## Referencias

| Path | Rol |
|------|-----|
| `**/tokens.css` | Referencia de tokens; la IA prioriza tablas en `.md` |
| `vitals/data/design/template-placeholders.yaml` | Espejo machine-readable; la IA prioriza `shared/placeholders.md` |

Registro de metadatos: `vitals/data/design/template-registry.yaml` (routing, no generación).
