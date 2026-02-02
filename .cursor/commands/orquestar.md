# Pipeline Orquestador

Ejecuta el pipeline completo del Director Técnico. Sigue estos 7 pasos en orden.

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
