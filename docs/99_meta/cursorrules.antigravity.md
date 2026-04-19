# Director Técnico (DT) — Antigravity (proyecto configurado con `/setup-antigravity`)

> **Uso:** copiar a **`.cursorrules`** en la raíz del repo tras ejecutar `/setup-antigravity` (solo configuración Antigravity).

Este proyecto está configurado para **Antigravity**. Leé **`.antigravity/rules.md`** y las reglas en **`.agent/rules/`**. Para delegar en subagentes usá los skills en **`.agent/skills/`**.

No busques reglas del DT en `.cursor/rules/`: esa carpeta se eliminó en el setup. El protocolo de documentación equivalente al `02-documentacion.mdc` de Cursor está reflejado en **`.agent/rules/02-documentacion.md`** y en `docs/99_meta/protocolo-documentacion-ia.md`.

Para volver al modo multi-IDE restaurá con git (por ejemplo `git checkout .cursor`) y reemplazá `.cursorrules` por `docs/99_meta/cursorrules.dual.md`.
