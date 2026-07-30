---
dt_command: setup-cursor
group: framework
group_title: "Framework DT"
tagline: "Dejar solo configuración Cursor en este clon."
---

# Setup Cursor

Este comando configura el proyecto para usar **solo** Cursor IDE. Elimina artefactos Antigravity (`.antigravity/`, `.agents/rules/`, `.agents/workflows/`) sin tocar `.agents/skills/` ni contexto local (Codex / marketing / design).

## Qué hacer

1. **Confirmar con el usuario**: Pregunta explícitamente "¿Confirmás que querés eliminar `.antigravity/` y los workflows/rules de Antigravity en `.agents/` para dejar solo la configuración de Cursor?" No procedas sin confirmación explícita.

2. **Ajustar `.cursorrules` (foco Cursor)**: **Antes o después** de borrar (el archivo está en la raíz), reemplazá el contenido de **`.cursorrules`** copiando íntegramente **`docs/99_meta/cursorrules.cursor.md`**. Así el contexto del agente queda alineado solo con Cursor y **`.cursor/rules/*.mdc`**.

3. **Eliminar carpetas Antigravity**: Una vez confirmado, eliminá `.antigravity/`, `.agents/rules/` y `.agents/workflows/` si existen. **No** elimines `.agents/skills/`, `.agents/product-marketing.md`, `vitals/`, `docs/` ni `scripts/`.

4. **Informar al usuario**: Indica que el setup está completo. El proyecto ahora usa `.cursor/` para la configuración del DT y `.cursorrules` refleja modo Cursor.

5. **Restauración**: Si el usuario necesita volver a multi-IDE: `git checkout .antigravity .agents/rules .agents/workflows` y restaurá **`.cursorrules`** (por ejemplo desde `docs/99_meta/cursorrules.dual.md` o `git checkout .cursorrules`).

## Importante

Este comando **solo** se ejecuta cuando el usuario lo invoca explícitamente. No eliminés artefactos Antigravity sin que el usuario lo pida.
