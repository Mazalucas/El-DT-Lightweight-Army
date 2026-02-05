---
description: Configurar proyecto solo para Antigravity - Elimina .cursor/ para evitar conflictos entre IDEs
---

# Setup Antigravity

Este workflow configura el proyecto para usar **solo** Antigravity IDE. Elimina la carpeta `.cursor/` para asegurar que no haya conflictos entre configuraciones de distintos IDEs.

1. **Confirmar con el usuario**: Pregunta explícitamente "¿Confirmás que querés eliminar la carpeta .cursor/ para dejar solo la configuración de Antigravity?" No procedas sin confirmación explícita.

2. **Eliminar .cursor/**: Una vez confirmado, elimina la carpeta `.cursor/` del proyecto (incluyendo rules, commands y agents).

3. **Informar al usuario**: Indica que el setup está completo. El proyecto ahora usa solo `.agent/` y `.antigravity/` para la configuración del DT.

4. **Restauración**: Si el usuario necesita volver a usar Cursor, puede restaurar con `git checkout .cursor`

**Importante**: Este workflow solo se ejecuta cuando el usuario lo invoca explícitamente. No eliminés `.cursor/` sin que el usuario lo pida.
