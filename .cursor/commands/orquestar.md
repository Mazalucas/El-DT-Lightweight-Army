# Pipeline Orquestador

**Macro (4 fases) vs micro (8 pasos):** el core del DT resume el flujo en **4 fases** (`Clarificar → Planificar y validar → Ejecutar → Entregar`). Este comando es el **desglose en 8 pasos**; no es un pipeline alternativo. Vitals: `vitals/INDEX.md`.

Ejecuta el pipeline completo del Director Técnico. Sigue estos 8 pasos en orden.

## Paso 1: Clarificar

Antes de actuar, clarifica:
- **Objetivo**: ¿Qué se busca lograr?
- **Restricciones**: ¿Hay límites de tiempo, tecnología, alcance?
- **Alcance**: ¿Qué está incluido y qué no?

Si hay ambigüedad, haz preguntas. No asumas.

## Paso 2: Cuestionar

No apruebes sin validar. Pregunta:
- "¿Consideraste X?"
- "¿Qué pasa si Y?"
- "¿Hay riesgos o dependencias no mencionadas?"

Solo después de validar, continúa.

## Paso 3: Mapear

Identifica los archivos relevantes del repo para la tarea:
- Carpetas clave
- Dependencias
- Puntos de entrada

## Paso 4: Delegar (si aplica)

Si la tarea requiere investigación profunda, verificación paralela o documentación, delega a subagentes:
- **arquitecto**: diseño backend, APIs, patrones
- **frontend**: implementación UI, componentes
- **qa**: test plans, edge cases, validación
- **doc**: documentación
- **researcher**: investigación, análisis

Consulta el catálogo de subagentes para decidir cuál invocar. Incluye los protocolos DT en el prompt de delegación.

## Paso 5: Planificar

Define:
- Checkpoints
- Orden de ejecución
- Alternativas si aplica

Presenta el plan antes de ejecutar. Espera aprobación si el usuario lo requiere.

## Paso 6: Ejecutar

Implementa con validación:
- Lint
- Tests
- Build

No entregues sin verificar que pasa.

## Paso 7: Entregar

Entrega:
1. Resumen ejecutivo
2. Cambios realizados
3. Verificación (tests, lint, build)
4. **Puntos ciegos / Mejoras detectadas** (si aplica)
5. (Opcional) PR-ready con descripción

## Paso 8: Cierre documental (si aplica)

Si el cambio afecta comportamiento, API, arquitectura, operaciones, setup de repo o el protocolo documental: ubicá el doc en la capa correcta bajo `docs/`, usá frontmatter YAML según `docs/99_meta/protocolo-documentacion-ia.md`, enlazá documentos relacionados, actualizá `docs/99_meta/id-registry.md` si hay prefijo `DOC-<DOMINIO>` nuevo, y `docs/99_meta/catalog.yaml` si corresponde. Si no aplica, indicá **N/A** en una línea. Usá el skill **doc** si hace falta redacción o migración de docs.
