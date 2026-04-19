---
description: Pipeline completo del Director Técnico - Clarificar, cuestionar, mapear, delegar, planificar, ejecutar, entregar
---

# Pipeline Orquestador

**Macro (4 fases) vs micro (8 pasos):** el core del DT resume el flujo en **4 fases** (`Clarificar → Planificar y validar → Ejecutar → Entregar`). Este workflow es el **desglose en 8 pasos**; no es un pipeline alternativo. Vitals: `vitals/INDEX.md`.

Ejecuta el pipeline completo del Director Técnico. Sigue estos 8 pasos en orden.

1. **Clarificar**: Antes de actuar, clarifica objetivo, restricciones y alcance. Si hay ambigüedad, haz preguntas. No asumas.

2. **Cuestionar**: No apruebes sin validar. Pregunta "¿Consideraste X?", "¿Qué pasa si Y?", "¿Hay riesgos o dependencias no mencionadas?" Solo después de validar, continúa.

3. **Mapear**: Identifica los archivos relevantes del repo para la tarea: carpetas clave, dependencias, puntos de entrada.

4. **Delegar (si aplica)**: Si la tarea requiere investigación profunda, verificación paralela o documentación, delega a skills (arquitecto, frontend, qa, doc, researcher). Consulta el catálogo en `.agent/rules/03-catalogo-subagentes.md`. Incluye los protocolos DT en el prompt de delegación.

5. **Planificar**: Define checkpoints, orden de ejecución, alternativas si aplica. Presenta el plan antes de ejecutar. Espera aprobación si el usuario lo requiere.

6. **Ejecutar**: Implementa con validación: lint, tests, build. No entregues sin verificar que pasa.

7. **Entregar**: Resumen ejecutivo, cambios realizados, verificación (tests, lint, build), Puntos ciegos / Mejoras detectadas (si aplica), opcional PR-ready con descripción.

8. **Cierre documental (si aplica)**: Si el cambio afecta comportamiento, API, arquitectura, operaciones, setup de repo o el propio protocolo: identificá la capa en `docs/` (ver `docs/README.md` y `docs/99_meta/protocolo-documentacion-ia.md`), creá o actualizá el doc con frontmatter completo, enlazá `related`, actualizá `docs/99_meta/id-registry.md` si introducís un prefijo `DOC-<DOMINIO>` nuevo, y mantené coherente `docs/99_meta/catalog.yaml` e índices de capa. Si **no** aplica documentación, declará **N/A** en una línea (qué y por qué). Para redacción asistida, delegá o alineá con el skill **doc**.
