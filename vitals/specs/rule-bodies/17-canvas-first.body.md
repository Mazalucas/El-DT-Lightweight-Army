# Canvas-first (entregas visuales)

El markdown extenso en el chat carga la vista y cansa. Cuando el IDE expone un **canvas** (Cursor Canvas, artifacts de Antigravity u otro lienzo visual equivalente), el DT lo usa como superficie **por defecto** para entregas estructuradas — el chat queda para conversar, no para volcar documentos.

## Cuándo aplica (obligatorio si hay canvas disponible)

Renderizar en canvas, no como markdown largo en el chat:

- **Planes** — fases, checkpoints, roadmaps, planes de `/orquestar`.
- **Propuestas** — alternativas con trade-offs, diseños, opciones A/B.
- **Confirmaciones extensas** — resúmenes de entrega con cambios, verificación y puntos ciegos.
- **Análisis y auditorías** — hallazgos categorizados, métricas, comparativas.
- **Cualquier respuesta que iba a tener 2+ tablas markdown o 4+ secciones con headers.**

Señal práctica: si estás por escribir una tabla markdown en el chat, frená y pasala a canvas.

## Superficie por IDE

- **Cursor — Canvas**: existe la skill `canvas` en el entorno (`~/.cursor/skills-cursor/canvas/SKILL.md`). Leerla **antes** de crear o editar cualquier `.canvas.tsx` — es la fuente de verdad de workflow, ubicación y SDK.
- **Antigravity — Artifacts**: la superficie nativa son los Artifacts del agente (markdown enriquecido, diagramas, screenshots, grabaciones), visibles en el Auxiliary Pane / Agent Manager y comentables por el usuario. Mapeo obligatorio:
  - Plan o propuesta → artifact **Implementation Plan** (pre-ejecución, esperar review del usuario salvo `/fast-lane`).
  - Desglose de pasos → artifact **Task List** con estados de avance.
  - Confirmación extensa / entrega → artifact **Walkthrough** (cambios, comandos ejecutados, verificación, cómo probar).
  - El chat acompaña con el mismo resumen corto que en Cursor; no duplicar el contenido del artifact en el chat.
- **Claude Code — Artifacts** (condicional): páginas HTML vivas publicadas desde la sesión a URL privada en claude.ai, con versionado y actualización en vivo. Se piden en lenguaje natural (no hay slash command); Claude escribe un `.html`/`.md` en el proyecto y pide permiso antes de publicar. **Solo disponible** en planes Team/Enterprise con login claude.ai y artifacts habilitados en la org — si la publicación falla o no está habilitada, caer al fallback sin insistir.
- **Codex — según superficie**: en la **Codex App**, el task sidebar y el artifact viewer previsualizan archivos generados (HTML autocontenido, PDF, planillas) — entregar el plan/análisis como archivo autocontenido que el viewer renderice. En el **CLI (TUI)** no hay superficie visual: aplicar el fallback de markdown liviano.
- **Otros IDEs**: si existe un mecanismo de artefacto visual equivalente, usarlo con el mismo criterio.
- **Sin superficie visual** (CLI puro, CI): aplicar el fallback de markdown liviano (abajo). No simular un canvas con archivos sueltos.

## Principios de diseño (ameno, sencillo, visual)

1. **Menos texto, más estructura**: stats, tablas, charts y pills antes que párrafos largos.
2. **Jerarquía clara**: una sola cosa debe dominar la vista; lo secundario va compacto o colapsable.
3. **Flat y minimal**: sin gradientes, sin emojis decorativos, sin sombras — seguir la guía anti-slop de la skill canvas.
4. **Interacción con propósito**: tabs/pills para alternativas de una propuesta, checklists para planes; no interactividad decorativa.
5. **Datos reales**: nunca placeholders ni secciones vacías. Si falta el dato, se omite la sección.

## Qué queda en el chat

El mensaje de chat acompaña, no duplica:

- **2–5 líneas**: resumen ejecutivo + referencia a la superficie visual (link al `.canvas.tsx` en Cursor; nombre del artifact en Antigravity).
- La decisión que se le pide al usuario, si la hay (pregunta concreta).
- Secciones obligatorias cortas (Contexto consultado, Puntos ciegos) pueden ir en el canvas; el chat las referencia.

## Cuándo NO usar canvas

- Respuestas cortas, aclaraciones, preguntas de validación del protocolo No cómplice.
- Fixes de código, diffs puntuales, trabajo dentro de un archivo existente.
- Entregables que viven en otra herramienta (un doc en `docs/`, un PR, un dashboard externo) — el canvas no reemplaza el artefacto canónico, puede complementarlo.
- Debugging activo o iteración rápida donde el canvas agregaría fricción.

## Fallback sin canvas (markdown liviano)

Cuando no hay canvas disponible, reducir la carga visual del markdown:

- Máximo 1 tabla por respuesta; preferir listas cortas.
- Headers solo cuando hay 3+ secciones reales.
- Resumen ejecutivo primero; detalle colapsado al final o en un doc bajo `docs/` si es entrega formal.

## Al delegar subagentes

Si el subagente produce una entrega estructurada y el entorno tiene canvas o artifacts, incluir en su prompt:

```text
Bloque canvas-first:
- Cursor: entregar planes/propuestas/análisis como .canvas.tsx (leer la skill canvas antes de escribir el archivo)
- Antigravity: usar Artifacts nativos (Implementation Plan / Task List / Walkthrough según fase)
- Claude Code: artifact HTML publicado (si el plan/org lo permite); si no, markdown liviano
- Codex: archivo autocontenido para el artifact viewer (App); markdown liviano en CLI
- Chat: resumen de 2-5 líneas + referencia a la superficie visual
- Estilo: flat, minimal, jerarquía clara, datos reales
```
