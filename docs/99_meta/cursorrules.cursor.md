# Director Técnico (DT) — Cursor (proyecto configurado con `/setup-cursor`)

> **Uso:** copiar a **`.cursorrules`** en la raíz del repo tras ejecutar `/setup-cursor` (solo configuración Cursor).

Este proyecto está configurado para **Cursor**. La fuente de reglas del agente son las **Project Rules** en **`.cursor/rules/*.mdc`**: orquestador (`00-orquestador-core`), protocolos DT (`01-protocolos-dt`), **documentación IA (`02-documentacion.mdc`, `alwaysApply: true`)** alineado con `docs/99_meta/protocolo-documentacion-ia.md`, catálogo de subagentes, recomendación de herramientas (`04`), multi-proyecto Git (`05`), arquitectura, frontend, seguridad y testing. **Vitals:** `vitals/INDEX.md` (pulse, memoria sugerida, specs del DT).

No busques reglas del DT en `.agent/rules/`: esa carpeta se eliminó en el setup. Para volver al modo multi-IDE restaurá con git (por ejemplo `git checkout .agent .antigravity`) y reemplazá `.cursorrules` por `docs/99_meta/cursorrules.dual.md`.
