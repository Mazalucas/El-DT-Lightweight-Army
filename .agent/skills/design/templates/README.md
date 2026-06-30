# Atelier — Style Templates Library

Plantillas canónicas por **lenguaje visual**. El DT y **ui-designer** basan la estética en los **archivos Markdown** de cada carpeta — la IA **lee e implementa**; no ejecuta scripts.

**Protocolo:** [PROTOCOL.md](PROTOCOL.md) · **Índice:** [INDEX.md](INDEX.md) · **Docs:** [atelier-templates-index.md](../../../docs/03_reference/atelier-templates-index.md) (`DOC-REF-004`)

## Regla de oro

1. Leer `.agents/design-context.md` (si existe).
2. Obtener estilo recomendado (`design-selector` / `dt-design-select`).
3. Cargar **solo** la carpeta del estilo en `styles/{style-id}/`.
4. Leer el `.md` de la superficie (landing, product-shell, auth, …) e implementar en el stack del proyecto.
5. `tokens.css` es referencia humana opcional — priorizar instrucciones en `.md`.

## Catálogo

| Estilo | Carpeta | Superficies (.md) |
|--------|---------|-------------------|
| Swiss | `styles/swiss-style/` | landing, product-shell |
| Bauhaus | `styles/bauhaus-style/` | landing, product-shell |
| Digital minimalism | `styles/digital-minimalism/` | landing, product-shell, auth |
| Neumorphism | `styles/neumorphism/` | controls, product-shell (≤20% UI) |
| Glassmorphism | `styles/glassmorphism/` | landing, product-shell, nav (≤30% glass) |

Registro: [`registry.yaml`](registry.yaml) · espejo [`vitals/data/design/template-registry.yaml`](../../../vitals/data/design/template-registry.yaml).

## vs ui-templates

| Capa | Path | Qué resuelve |
|------|------|--------------|
| **Style templates** (aquí) | `design/templates/styles/` | *Cómo se ve* — wireframes y reglas en Markdown |
| **Layout templates** | `design/ui-templates/references/templates/` | *Estructura* — auth, dashboard (agnóstico) |
| **System templates** | `design/templates/systems/` | *Design system* — homepage, pitch, dashboard SaaS |

## Multi-IDE

Fuente canónica: `.cursor/skills/design/templates/`. Sync: `./scripts/sync-ide.sh`.
