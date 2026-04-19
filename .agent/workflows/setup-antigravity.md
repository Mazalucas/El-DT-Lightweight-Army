---
description: Configurar proyecto solo para Antigravity - Elimina .cursor/ para evitar conflictos entre IDEs
---

# Setup Antigravity

Este workflow configura el proyecto para usar **solo** Antigravity IDE. Elimina la carpeta `.cursor/` para asegurar que no haya conflictos entre configuraciones de distintos IDEs.

1. **Confirmar con el usuario**: Pregunta explícitamente "¿Confirmás que querés eliminar la carpeta .cursor/ para dejar solo la configuración de Antigravity?" No procedas sin confirmación explícita.

2. **Ajustar `.cursorrules` (foco Antigravity)**: Reemplazá el contenido de **`.cursorrules`** en la raíz copiando íntegramente **`docs/99_meta/cursorrules.antigravity.md`**. Hacelo **antes** de borrar `.cursor/` si querés usar comandos desde esa carpeta; el archivo fuente vive en **`docs/99_meta/`** y no se elimina.

3. **Eliminar .cursor/**: Una vez confirmado, elimina la carpeta `.cursor/` del proyecto (incluyendo rules, commands y agents). **No** elimines `vitals/`, `docs/` ni `scripts/` — son compartidas y no dependen del IDE.

4. **Informar al usuario**: Indica que el setup está completo. El proyecto ahora usa solo `.agent/` y `.antigravity/` para la configuración del DT y `.cursorrules` refleja modo Antigravity.

5. **Restauración**: Si el usuario necesita volver a usar Cursor o el repo multi-IDE: `git checkout .cursor` y restaurá **`.cursorrules`** (por ejemplo desde `docs/99_meta/cursorrules.dual.md` o `git checkout .cursorrules`).

**Importante**: Este workflow solo se ejecuta cuando el usuario lo invoca explícitamente. No eliminés `.cursor/` sin que el usuario lo pida.
