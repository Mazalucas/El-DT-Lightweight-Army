# Setup Cursor

Este comando configura el proyecto para usar **solo** Cursor IDE. Elimina las carpetas `.agent/` y `.antigravity/` para asegurar que no haya conflictos entre configuraciones de distintos IDEs.

## Qué hacer

1. **Confirmar con el usuario**: Pregunta explícitamente "¿Confirmás que querés eliminar las carpetas .agent/ y .antigravity/ para dejar solo la configuración de Cursor?" No procedas sin confirmación explícita.

2. **Eliminar carpetas**: Una vez confirmado, elimina las carpetas `.agent/` y `.antigravity/` del proyecto.

3. **Informar al usuario**: Indica que el setup está completo. El proyecto ahora usa solo `.cursor/` para la configuración del DT.

4. **Restauración**: Si el usuario necesita volver a usar Antigravity, puede restaurar con `git checkout .agent .antigravity`

## Importante

Este comando **solo** se ejecuta cuando el usuario lo invoca explícitamente. No eliminés `.agent/` ni `.antigravity/` sin que el usuario lo pida.
