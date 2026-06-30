# Director Técnico (DT) — Repositorio multi-IDE

> Plantilla sugerida para **`.cursorrules`** en la raíz. El DT v1.7+ soporta **todos** los IDEs enabled en `vitals/config/ide-targets.yaml` sin borrar carpetas. Setup: **`/bienvenida`** (primera vez) o **`/setup`** (repair).

## Si usás **Cursor**

La fuente de reglas del agente son las **Project Rules** en **`.cursor/rules/*.mdc`**: orquestador, protocolos, catálogo de subagentes, recomendación de herramientas, multi-proyecto Git, **`06-dt-colaboracion`** (sesión `/yo`, ritual Git), arquitectura, frontend, seguridad, testing y **`02-documentacion.mdc`** (protocolo de documentación IA, `alwaysApply: true` → `docs/99_meta/protocolo-documentacion-ia.md`). **Cerebro del equipo:** `docs/00_overview/cerebro-equipo-mecanismos-dt.md` (`DOC-OV-004`) · **IA:** `AGENTS.md` · **Telemetría:** `vitals/INDEX.md`.

**Otros IDEs** (Antigravity, Claude Code, Codex, Copilot) tienen espejos generados desde las mismas fuentes canónicas — ver `docs/02_guides/ide-setup.md` (`DOC-GUIDE-001`).

## Si usás **Antigravity**

Leé **`.antigravity/rules.md`** y las reglas en **`.agent/rules/`**. Para delegar tareas especializadas usá los skills en **`.agent/skills/`**.

## Primera vez en este repo

```text
/bienvenida  →  /yo  →  trabajar  →  /guardar
/actualizar  =  solo cuando el remoto tenga novedades del equipo
```

No copies `session.yaml` a mano — **`/yo`** lo crea localmente.
