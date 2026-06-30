---
name: style-templates
description: "When applying a visual style template from Atelier — swiss, bauhaus, minimalism, neumorphism, or glass. Markdown-only: read wireframe specs and implement aesthetics in the project stack. Use after design-selector recommends a style, or when the user mentions 'style template,' 'swiss template,' 'Atelier templates,' or 'design/templates'."
metadata:
  version: 2.0.0
---

# Style Templates

Plantillas por **lenguaje visual** (overlay sobre estructura). Fuente de verdad: **archivos `.md`** en cada carpeta de estilo — la IA lee e implementa; **no** ejecuta scripts.

## Protocolo obligatorio

Leer primero: [`templates/PROTOCOL.md`](../templates/PROTOCOL.md)

## Ubicación

| Recurso | Path |
|---------|------|
| Índice | `.cursor/skills/design/templates/INDEX.md` |
| Estilos | `.cursor/skills/design/templates/styles/{style-id}/` |
| Registro (routing) | `vitals/data/design/template-registry.yaml` |

## Workflow (IA)

1. Confirmar `style-id` desde `design-context.md` o `dt-design-select`.
2. Leer **solo** la carpeta del estilo — nunca las 5 a la vez.
3. Abrir el `.md` de la superficie (`landing.md`, `product-shell.md`, `auth.md`, etc.).
4. Aplicar reglas, wireframes ASCII y tablas de componentes del Markdown al stack del proyecto.
5. Respetar cuotas del registro (`max_ui_percent`, `max_glass_percent`).
6. Estructura agnóstica: combinar con `ui-templates/` si hace falta layout base.
7. Declarar **Design Read** (`design-read`) con dials del registro.
8. Pre-entrega: `anti-slop` + `dt-design-detect` sobre código entregado.

## Mapa rápido

| style-id | Superficies (.md) | Cuotas |
|----------|-------------------|--------|
| `swiss-style` | landing, product-shell | — |
| `bauhaus-style` | landing, product-shell | — |
| `digital-minimalism` | landing, product-shell, auth | — |
| `neumorphism` | controls, product-shell | ≤20% UI |
| `glassmorphism` | landing, product-shell, nav-overlay | ≤30% glass |

## tokens.css

Archivo **opcional de referencia humana**. La IA **prioriza** instrucciones en los `.md` (reglas, medidas, anti-patterns). Si un `.md` no lista un token, inferir del wireframe o documentar en `design-context.md`.

## Qué NO hacer

- No regenerar previews HTML
- No cargar múltiples estilos en un turno
- No ignorar cuotas neumorphism/glass del registro

## Related Skills

- **design-selector** — elige estilo
- **system-templates** — design system base (Fase 1)
- **ui-templates** — layout agnóstico
- **styles/** — principios profundos del estilo
- **anti-slop** — validación
