---
name: analisis-propuesta
description: >-
  Panel multi-modelo que evalúa si un plan o propuesta cumple el objetivo,
  es escalable, óptimo y replicable — con feedback cruzado en dos rondas.
  Use when /analisis-propuesta, analizar plan, validar propuesta, panel de
  revisión, approach correcto, puntos ciegos del plan, alternativas al plan.
  Solo diagnóstico: no implementar ni escribir en el repo.
---

## Protocolos DT (heredar)

Orquestador: ordenar, cuestionar, alternativas, **Contexto consultado**, **Puntos ciegos**. Este skill **no** delega en un subagente del catálogo de 23.

## Activación

`/analisis-propuesta`, mención de esta skill, o pedido explícito de panel multi-modelo sobre un **plan ya escrito**.

Diferencia con `/cuestionar`: `/cuestionar` es un solo modelo, preguntas y trade-offs sin panel ni `Task` con otros LLM. `/analisis-propuesta` exige propuesta congelada y al menos dos familias de modelo además del autor.

## Mandato duro (no negociable)

1. **No implementar** — ni el plan evaluado ni mejoras sugeridas. Sin editar código, `docs/`, reglas, skills, `vitals/`, config versionada, commits, canvas ni informes en disco.
2. **Solo leer** — el repo y docs pueden consultarse para contrastar el plan con la realidad.
3. **Sin garantías** — prohibido afirmar que el plan asegura el objetivo al 100%. Usar **condiciones de fallo** (`references/rubrica.md`). Porcentajes solo como `DERIVADO` (regla `16`).
4. **Sin plan inventado** — si el usuario no pegó o no hay plan en el hilo, pedir el texto del plan y el objetivo; no redactar un plan sustituto para evaluarlo.
5. **Diversidad real** — no simular tres voces con un solo modelo. Si no hay panel diverso, parar y explicar (ver §Selección de panel).

`/yo` no es obligatorio: no hay escritura en el repo.

## Entrada mínima (congelar en el prompt)

Antes de lanzar panelistas, el orquestador fija un bloque **Brief congelado** (chat o prompt de `Task`, no archivo):

- **Objetivo declarado**
- **Restricciones** (tiempo, stack, presupuesto, compliance)
- **Fuera de alcance**
- **Plan / propuesta** (texto completo)
- **Modelo autor** (slug del modelo que escribió el plan, si se conoce; si no, `desconocido` y excluir solo `inherit` del panel)

Todos los panelistas reciben el mismo brief.

## Selección de panel

1. Leer `vitals/config/analisis-propuesta.yaml`.
2. Cruzar con los slugs disponibles en la sesión (`available_subagent_models` en Task).
3. Por cada **familia** en orden del YAML, elegir el **primer** slug listado que exista en la sesión y no esté en `never_panel` ni sea el modelo autor.
4. Tomar hasta `panel_size` (default 3) slugs de **familias distintas**.
5. **Parar** si hay menos de **2** familias elegibles además del autor (o menos de 2 en total si autor desconocido). Mensaje: panel no diverso; sugerir `/cuestionar` o ampliar modelos en el IDE.

Registrar en la entrega: slugs del panel y familia de cada uno.

## Pipeline

### 0. Clarificar solo si falta brief

Una ronda corta de preguntas si falta objetivo o plan. No pasar a panel sin brief congelado.

### 1. Ronda 1 — paralelo y a ciegas

Tres invocaciones `Task` en **un mismo mensaje** (paralelo):

- `subagent_type: generalPurpose`
- `model: <slug del panelista>`
- Prompt: rol de **revisor independiente**; leer `.cursor/skills/analisis-propuesta/references/rubrica.md`; aplicar al brief congelado; permitido leer repo; **prohibido** escribir en el proyecto; devolver **solo** el esquema Ronda 1 (sin sección Ronda 2).

El usuario invocó `/analisis-propuesta` → cuenta como pedido explícito de otros modelos.

### 2. Ronda 2 — feedback cruzado

Para cada panelista, `Task` con `resume: <agent_id>` de la Ronda 1:

- Adjuntar los dictámenes de los **otros** panelistas, etiquetados por `model_slug`.
- Instrucción: coincidir o rechazar con motivo; si adoptan idea ajena, citar de quién; completar sección **Ronda 2** del esquema; pueden cambiar la recomendación con justificación.

Pueden lanzarse en paralelo cuando los tres IDs de Ronda 1 estén disponibles.

### 3. Síntesis

- Si el **modelo padre** es el autor del plan → el veredicto integrado lo redacta un **panelista que no sea el autor** (última Ronda 2: pedir bloque **Síntesis del panel** de `rubrica.md`). En disenso, preferir que redacte quien mantuvo la recomendación más conservadora (`rechazar` / `reformular`) y deje visible el disenso.
- Si el padre **no** es el autor → el padre puede sintetizar usando el esquema de síntesis, citando los tres dictámenes finales.
- El padre cierra al usuario con protocolo **Orden** (`01-protocolos-dt`): conclusión, cuerpo, **Resumen** si es largo, **un** siguiente paso (p. ej. ajustar plan, `/orquestar`, `/fast-lane` — nunca implementar desde este skill).

## Entrega en chat (orden)

1. **Recomendación integrada** (`adoptar` | `adoptar_con_cambios` | `rechazar` | `reformular`)
2. **Panel** — tabla o lista: modelo, recomendación, delta Ronda 1→2
3. **Cambios obligatorios** vs **opcionales** al plan (si aplica)
4. **Propuesta superadora** (si algún panelista la justificó)
5. **Condiciones de fallo** fusionadas
6. **Disenso** (si existe) — no ocultar minoría
7. **Límite del método** — consenso no es garantía; puntos ciegos compartidos posibles
8. **Contexto consultado** · **Puntos ciegos**

No canvas. No archivo en `vitals/work/`.

## Cuándo NO usar este skill

| Pedido | Camino |
|--------|--------|
| Solo preguntas, sin plan escrito | `/cuestionar` |
| Ejecutar o implementar el plan | `/orquestar` o `/fast-lane` |
| Auditoría de seguridad | `/hack` |
| Verificar cifras del plan | `/verificar` |

## Reglas

`01-protocolos-dt` · `16-numeric-grounding` (solo si hay estimaciones numéricas) · `17-canvas-first` **no** aplica (entrega chat).

## Referencias

- **`references/rubrica.md`** — dimensiones, esquema, síntesis
- Doc canónico: `docs/03_reference/analisis-propuesta.md` (`DOC-REF-011`)
- Config: `vitals/config/analisis-propuesta.yaml`
