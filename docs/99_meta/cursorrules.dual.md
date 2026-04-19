# Director Técnico (DT) — Repositorio multi-IDE (plantilla dual)

> **Uso:** contenido sugerido para la raíz **`.cursorrules`** cuando el repo tiene **Cursor y Antigravity** sin haber corrido un setup que deje un solo IDE. Tras `/setup-cursor` o `/setup-antigravity`, el agente debe reemplazar `.cursorrules` por la plantilla **cursor** o **antigravity** en esta misma carpeta.

## Si usás **Cursor**

La fuente de reglas del agente son las **Project Rules** en **`.cursor/rules/*.mdc`**: orquestador, protocolos, catálogo de subagentes, recomendación de herramientas, multi-proyecto Git, arquitectura, frontend, seguridad, testing y **`02-documentacion.mdc`** (protocolo de documentación IA, `alwaysApply: true` → `docs/99_meta/protocolo-documentacion-ia.md`). **Vitals:** `vitals/INDEX.md`.

**`.agent/rules/`** es el equivalente para Antigravity, no la fuente principal en Cursor.

## Si usás **Antigravity**

Leé **`.antigravity/rules.md`** y las reglas en **`.agent/rules/`**. Para delegar tareas especializadas usá los skills en **`.agent/skills/`**.

**`.cursor/rules/*.mdc`** es el equivalente para Cursor; en Antigravity no están activas si no existe `.cursor/`.

## Setup multi-IDE

Los comandos **`/setup-cursor`** y **`/setup-antigravity`** solo se ejecutan cuando el usuario lo pide. Ajustan `.cursorrules` al IDE elegido (plantillas en esta carpeta) y eliminan la carpeta del otro IDE. No borres carpetas sin confirmación explícita.
