# Setup Cursor

Este comando configura el proyecto para usar **solo** Cursor IDE. Elimina las carpetas `.agent/` y `.antigravity/` para asegurar que no haya conflictos entre configuraciones de distintos IDEs.

## Qué hacer

1. **Confirmar con el usuario**: Pregunta explícitamente "¿Confirmás que querés eliminar las carpetas .agent/ y .antigravity/ para dejar solo la configuración de Cursor?" No procedas sin confirmación explícita.

2. **Ajustar `.cursorrules` (foco Cursor)**: **Antes o después** de borrar (el archivo está en la raíz), reemplazá el contenido de **`.cursorrules`** copiando íntegramente **`docs/99_meta/cursorrules.cursor.md`**. Así el contexto del agente queda alineado solo con Cursor y **`.cursor/rules/*.mdc`**.

3. **Eliminar carpetas**: Una vez confirmado, elimina las carpetas `.agent/` y `.antigravity/` del proyecto. **No** elimines `vitals/`, `docs/` ni `scripts/` — son compartidas y no dependen del IDE.

4. **Informar al usuario**: Indica que el setup está completo. El proyecto ahora usa solo `.cursor/` para la configuración del DT y `.cursorrules` refleja modo Cursor.

5. **Restauración**: Si el usuario necesita volver a usar Antigravity o el repo multi-IDE: `git checkout .agent .antigravity` y restaurá **`.cursorrules`** (por ejemplo desde `docs/99_meta/cursorrules.dual.md` o `git checkout .cursorrules`).

## Importante

Este comando **solo** se ejecuta cuando el usuario lo invoca explícitamente. No eliminés `.agent/` ni `.antigravity/` sin que el usuario lo pida.
