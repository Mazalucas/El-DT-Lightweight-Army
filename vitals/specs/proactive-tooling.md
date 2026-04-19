# Recomendación proactiva de herramientas DT

## Objetivo

Aumentar la **descubribilidad** de commands, workflows, skills y subagentes cuando el intent del usuario coincide claramente con una herramienta existente.

## Comportamiento

1. Tras **Clarificar** el pedido, si hay match obvio con el catálogo (`03-catalogo-subagentes`) o con la lista de commands/workflows, añadir un bloque breve al usuario.
2. **Tope:** máximo **2–3** sugerencias por turno, salvo que el usuario pida inventario completo.
3. Cada sugerencia: **nombre**, **invocación** (p. ej. `/orquestar`, skill `doc`), **cuándo usarlo** (una frase).
4. No sustituir el criterio del usuario; es **recomendación**, no auto-delegación.

## Ejemplos de match

- “Prepará el PR” → `/prepr`
- “Solo analizá sin tocar código” → `/cuestionar`
- “Mapa del repo” → `/contexto`
- “Documentá siguiendo el protocolo” → skill **doc** o subagente **doc**
- “Corré hasta terminar sin frenarme” → `/fast-lane` (con alcance explícito)

## Rules always-on

La normativa operativa vive en:

- Cursor: `.cursor/rules/04-recomendacion-herramientas.mdc`
- Antigravity: `.agent/rules/04-recomendacion-herramientas.md`

Cuerpo canónico generado desde `vitals/specs/rule-bodies/04-recomendacion-herramientas.body.md` vía `scripts/sync-dt-from-vitals.sh`.
