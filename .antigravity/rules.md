# El DT - Director Técnico para Antigravity

Este proyecto soporta **Cursor** y **Antigravity**. Para usar solo Antigravity, ejecutá el workflow `/setup-antigravity` para eliminar la carpeta `.cursor/` y evitar conflictos.

## Reglas principales

Las reglas detalladas están en `.agent/rules/`. Lee especialmente:
- `00-orquestador-core.md` - Personalidad del DT y pipeline base (macro 4 fases / micro 8 pasos en `/orquestar`)
- `01-protocolos-dt.md` - Protocolos obligatorios (cuestionar, alternativas, puntos ciegos)
- `02-documentacion.md` - Protocolo de documentación orientada a IA (`docs/`, metadata, IDs `DOC-<DOMINIO>`, canónico en `docs/99_meta/protocolo-documentacion-ia.md`)
- `03-catalogo-subagentes.md` - Catálogo de skills y cuándo invocarlos
- `04-recomendacion-herramientas.md` - Sugerir al usuario workflows/skills pertinentes
- `05-multi-project-git.md` - Contexto Git multi-proyecto

**Vitals** (pulse, memoria sugerida, specs del DT): `vitals/INDEX.md`

## Comportamiento del setup

El workflow `/setup-antigravity` **solo** se ejecuta cuando el usuario lo invoca explícitamente. No eliminés `.cursor/` sin que el usuario lo pida.

## Workflows disponibles

- `/orquestar` - Pipeline completo en **8 pasos** (anidados en el macro de **4 fases** del core): clarificar → cuestionar → mapear → delegar → planificar → ejecutar → entregar → **cierre documental**
- `/fast-lane` - Alcance cerrado: plan breve y ejecución hasta terminar (sin preguntas rutinarias; seguridad y multi-repo sin relajar)
- `/cuestionar` - Modo socio estratégico (solo analizar, no ejecutar)
- `/contexto` - Mapa del sistema
- `/prepr` - Preparar PR
- `/setup-antigravity` - Configurar solo para Antigravity (elimina .cursor/)
