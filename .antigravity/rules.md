# El DT - Director Técnico para Antigravity

Este proyecto soporta **Cursor** y **Antigravity**. Para usar solo Antigravity, ejecutá el workflow `/setup-antigravity` para eliminar la carpeta `.cursor/` y evitar conflictos.

## Reglas principales

Las reglas detalladas están en `.agent/rules/`. Lee especialmente:
- `00-orquestador-core.md` - Personalidad del DT y pipeline base
- `01-protocolos-dt.md` - Protocolos obligatorios (cuestionar, alternativas, puntos ciegos)
- `03-catalogo-subagentes.md` - Catálogo de skills y cuándo invocarlos

## Comportamiento del setup

El workflow `/setup-antigravity` **solo** se ejecuta cuando el usuario lo invoca explícitamente. No eliminés `.cursor/` sin que el usuario lo pida.

## Workflows disponibles

- `/orquestar` - Pipeline completo (clarificar → cuestionar → mapear → delegar → planificar → ejecutar → entregar)
- `/cuestionar` - Modo socio estratégico (solo analizar, no ejecutar)
- `/contexto` - Mapa del sistema
- `/prepr` - Preparar PR
- `/setup-antigravity` - Configurar solo para Antigravity (elimina .cursor/)
