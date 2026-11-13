---
name: dt-ayuda
description: "[Rutina] Mapa corto de qué puede hacer El DT y qué comando o especialista usar según lo que la persona necesita. Use when the user invokes /ayuda or asks what the DT can do, which skill to use, or where to start."
---

# dt-ayuda

Respuesta **corta**, pensada para quien se distrae: una pantalla, un siguiente paso. No es el catálogo completo.

## Antes de responder

1. Leé `vitals/config/commands-meta.yaml` (tagline + when). No inventes comandos.
2. Si hace falta un especialista, usá el mapa de `.cursor/rules/03-catalogo-subagentes.mdc`. Nombrá **uno**.
3. Si no hay `vitals/ops/session.yaml` con `operator.id`, el siguiente paso es **`/yo`**, no otro comando. Decilo en una línea y seguí con la sugerencia.

## Si la persona no dijo qué necesita

Un solo mensaje. Máximo **14 líneas con texto**. Frases cortas.

```markdown
Soy **El DT**. Ordeno el proyecto, pregunto antes de hacer y dejo cada avance guardado.

**Pedime algo y yo elijo la herramienta.** Ejemplos:
1. **Armar o cambiar** el proyecto → `/orquestar`
2. **Pensar sin tocar** nada → `/cuestionar`
3. **Diseño, seguridad, números o legal** → decime cuál

👉 ¿Qué necesitás ahora? Una frase alcanza.
Si ya lo sabés, el más usado es **`/orquestar`**.
```

No listes más de 3 caminos. El resto entra cuando pregunten.

## Si ya dijo qué necesita

1. **Una** recomendación (comando o especialista), marcada como la que harías vos.
2. **Una** alternativa, en una línea, con el trade-off (más preguntas vs más rápido, o solo análisis vs ejecutar).
3. Cerrá con **un** 👉: el comando listo para copiar, o la frase que tiene que escribir.

No pegues el README. Si pide “mostrame todo”, enlazá [README — comandos](../../../README.md) y repetí el 👉.

## Mapa rápido (no lo vuelques entero)

| Necesita | Sugerí |
|----------|--------|
| No sabe por dónde | este skill, pregunta de una frase |
| Primera vez / clone | `/bienvenida` |
| Quién soy | `/yo` |
| Traer cambios | `/actualizar` |
| Cerrar y subir | `/guardar` |
| Idea grande | `/orquestar` |
| Solo opinar | `/cuestionar` |
| Alcance ya cerrado | `/fast-lane` |
| Pantallas | `/atelier` |
| Seguridad del repo | `/hack` |
| Legal de la app | `/auditoria-legal` |
| Planilla o totales | `/verificar` |
| Muchos archivos o notas | `/ordenar` |
| Convertir el DT en su proyecto | `/bootstrap` |
| Video | skill `video-routing` antes de producir |
| Instalar plugin, MCP, repo o paquete nuevo | skill `dt-revisar-instalacion` antes de instalar |

## No hacer

- No ejecutes el comando que sugeriste en el mismo turno, salvo que lo haya pedido junto con `/ayuda`.
- No abras más de un especialista.
- No repitas el guion de `/bienvenida` si ya hay sesión: andá a la sugerencia.
