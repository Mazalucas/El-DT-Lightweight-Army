---
id: DOC-META-001
title: Protocolo de documentación orientada a IA
type: policy
status: canonical
owner: dt-platform
created: 2026-04-19
updated: 2026-04-19
tags:
  - documentation
  - ai
  - retrieval
  - metadata
domain:
  - meta
summary: Estándar para organizar, redactar, indexar y mantener documentación maximizando relevancia por token para humanos y sistemas de IA.
related:
  - DOC-META-002
  - DOC-CONCEPT-001
  - DOC-GUIDE-003
keywords:
  - protocol
  - chunks
  - yaml frontmatter
  - docs layers
priority: high
intended_audience:
  - engineers
  - ai-agents
source_of_truth: true
review_cycle_days: 90
---

# Protocolo de documentación orientada a IA

## Objetivo

Definir un estándar universal para organizar, redactar, indexar y mantener documentación de proyecto de forma que sea fácil de encontrar, interpretar y reutilizar tanto por humanos como por sistemas de IA.

## Principio rector

La documentación no debe optimizarse solo para almacenamiento, sino para recuperación eficiente de contexto.

**Objetivo formal:** maximizar relevancia por token.

$$
\max \frac{\text{información útil recuperada}}{\text{tokens consumidos}}
$$

---

## 1. Principios fundamentales

### 1.1 Fuente única de verdad

Cada concepto importante debe tener un documento canónico.
No se permite duplicación semántica innecesaria.

### 1.2 Legibilidad dual

Todo documento debe ser entendible por:

* una persona que navega manualmente
* una IA que recupera fragmentos parciales

### 1.3 Recuperabilidad antes que exhaustividad

Es preferible dividir bien la información y enlazarla, antes que concentrarla en documentos enormes.

### 1.4 Semántica explícita

La estructura, los nombres, los metadatos y los vínculos deben expresar intención.

### 1.5 Modularidad

Cada documento y cada sección deben responder una pregunta concreta.

### 1.6 Estabilidad con evolución controlada

La documentación debe poder crecer sin degradar la precisión del retrieval.

---

## 2. Arquitectura por capas

La carpeta `docs/` debe diseñarse como un sistema en capas.

```text
docs/
  00_overview/
  01_concepts/
  02_guides/
  03_reference/
  04_architecture/
  05_decisions/
  06_operations/
  07_glossary/
  99_meta/
```

### 2.1 `00_overview/`

Puerta de entrada.
Contiene mapa general, índice maestro, quickstart, overview del proyecto.

### 2.2 `01_concepts/`

Define ideas, modelos mentales, reglas del negocio, entidades, flujos conceptuales.
Debe responder “qué es” y “por qué existe”.

### 2.3 `02_guides/`

Explica cómo realizar tareas.
Debe responder “cómo hago X”.

### 2.4 `03_reference/`

Lookup rápido, preciso y estable.
Debe responder “cuál es el endpoint”, “qué parámetros usa”, “qué flags existen”.

### 2.5 `04_architecture/`

Describe componentes, límites, dependencias, diagramas, decisiones de diseño global.

### 2.6 `05_decisions/`

Contiene ADRs y decisiones formales.
Debe responder “por qué elegimos esto y no aquello”.

### 2.7 `06_operations/`

Runbooks, troubleshooting, despliegues, monitoreo, incidentes.

### 2.8 `07_glossary/`

Glosario, taxonomía, alias, términos reservados, siglas.

### 2.9 `99_meta/`

Políticas editoriales, protocolo documental, plantillas, convenciones.

---

## 3. Tipos documentales

Cada archivo debe pertenecer explícitamente a un tipo.

Tipos sugeridos:

* `overview`
* `concept`
* `guide`
* `reference`
* `architecture`
* `decision`
* `runbook`
* `glossary`
* `policy`
* `faq`

Esto permite que la IA ajuste expectativas de lectura.

---

## 4. Convenciones de nombre

### 4.1 Nombres estables

Usar nombres claros, semánticos y duraderos.

Correcto:

* `authentication-overview.md`
* `jwt-refresh-flow.md`
* `api-auth-reference.md`

Incorrecto:

* `final.md`
* `new-final-v2.md`
* `misc-notes.md`

### 4.2 Sin ambigüedad ni ruido temporal

Las versiones temporales no deben vivir como archivos paralelos salvo que formen parte de un esquema formal.

### 4.3 Un archivo, una intención

Cada archivo debe tener un tema dominante reconocible.

---

## 5. Metadatos obligatorios

Todo documento debe empezar con metadatos estructurados.

Ejemplo:

```yaml
---
id: DOC-AUTH-001
title: Authentication Overview
type: concept
status: canonical
owner: backend-platform
created: 2026-04-01
updated: 2026-04-01
tags:
  - authentication
  - jwt
  - sessions
domain:
  - backend
  - security
summary: Explica el modelo general de autenticación, sus componentes y el flujo de sesión.
related:
  - DOC-AUTH-010
  - DOC-ARCH-003
keywords:
  - login
  - token
  - refresh token
  - authorization
priority: high
intended_audience:
  - engineers
  - ai-agents
source_of_truth: true
review_cycle_days: 90
---
```

### 5.1 Campos mínimos

* `id`
* `title`
* `type`
* `status`
* `owner`
* `updated`
* `tags`
* `summary`
* `related`
* `priority`
* `source_of_truth`

### 5.2 Beneficios

Los metadatos permiten:

* filtrado previo
* ranking híbrido
* control de autoridad
* deduplicación
* gobernanza documental

### 5.3 Campos opcionales — trazabilidad multi-agente y pulse

Cuando un documento bajo `docs/` fue producido o revisado con intervención explícita de subagentes o skills, o cuando se desea enlazar un latido del orquestador, podés añadir **uno o más** de estos campos al frontmatter (todos opcionales):

* **`agent_contributors`**: lista de objetos con al menos `agent_id` (string) y `scope` (string: qué cubrió). Recomendado: `pulse_ref` (string: `pulse_id` en `vitals/pulse/entries/`).
* **`handoff_chain`**: lista ordenada de `agent_id` que intervinieron (auditoría de pasaje de control).
* **`pulse_ref`**: un solo `pulse_id` si el doc se asocia a un evento concreto en Vitals.

No son obligatorios para documentos históricos ni para texto puramente humano. Ejemplo:

```yaml
agent_contributors:
  - agent_id: doc
    scope: "Redacción y frontmatter"
    pulse_ref: dt-20260419-001
  - agent_id: qa
    scope: "Revisión de checklist"
handoff_chain: [doc, qa, dt]
pulse_ref: dt-20260419-001
```

---

## 6. Estructura interna de cada documento

Todo documento debe seguir una plantilla predecible.

## Plantilla recomendada

1. Título
2. Summary
3. Purpose
4. Scope
5. Main content
6. Related docs
7. FAQs o edge cases
8. Changelog opcional

### 6.1 Summary obligatorio

El resumen inicial debe poder leerse de forma aislada y permitir decidir si el documento es relevante.

### 6.2 Scope

Debe dejar claro qué cubre y qué no cubre.

### 6.3 Related docs

Debe apuntar a conceptos, guías, referencias y decisiones vinculadas.

---

## 7. Reglas de chunking

### 7.1 Unidad lógica mínima

Cada sección debe responder una sola pregunta.

### 7.2 Tamaño recomendado

* sección ideal: 150 a 400 palabras
* subsección máxima recomendada antes de dividir: 500 a 700 palabras

### 7.3 Encabezados descriptivos

Los encabezados deben tener sentido fuera del documento completo.

Correcto:

* `How refresh tokens are rotated`
* `Failure modes during login`

Incorrecto:

* `More details`
* `Other cases`

### 7.4 Contexto heredado

Cada chunk debe llevar consigo suficiente contexto para ser entendido solo.
Por eso conviene repetir de forma ligera el sujeto principal.

### 7.5 No mezclar múltiples conceptos en el mismo bloque

Cada bloque debe poder extraerse y citarse sin arrastrar demasiado ruido.

---

## 8. Enlaces y navegación

La estructura de carpetas es un árbol, pero el conocimiento debe comportarse también como un grafo.

### 8.1 Enlaces obligatorios

Cada documento debe enlazar:

* documento padre o overview relacionado
* referencias técnicas asociadas
* decisiones relevantes
* documentos complementarios

### 8.2 Navegación orientada a preguntas

El índice maestro debe incluir secciones del tipo:

* Si quieres entender X
* Si quieres implementar Y
* Si quieres consultar Z

### 8.3 Relaciones tipadas

Idealmente distinguir:

* `depends_on`
* `implements`
* `explains`
* `supersedes`
* `see_also`

---

## 9. Índices y mapas

## 9.1 README maestro en `docs/`

Debe actuar como portal principal.

Contenido mínimo:

* propósito de la documentación
* mapa por capas
* rutas rápidas por tipo de pregunta
* documentos canónicos clave

## 9.2 Índices por dominio

Cada subdominio grande debe tener su propio índice.

Ejemplo:

* `docs/01_concepts/auth/README.md`
* `docs/03_reference/api/README.md`

## 9.3 Catálogo de documentos

Puede existir un `catalog.yaml` global con ids, títulos, tags y rutas.

---

## 10. Reglas anti-duplicación

### 10.1 Una idea principal, un lugar principal

Si una idea ya tiene documento canónico, otros documentos solo deben resumirla y enlazarla.

### 10.2 Prohibido el solapamiento silencioso

Si dos documentos cubren casi lo mismo, debe quedar explícita su diferencia.

### 10.3 Estados permitidos

Un documento puede tener estados como:

* `canonical`
* `draft`
* `deprecated`
* `archived`

La IA debe poder distinguir rápidamente cuál usar.

---

## 11. Reglas de autoridad

La documentación debe señalar confiabilidad.

### 11.1 Prioridad documental

Sugerencia:

1. decision / policy
2. architecture
3. reference
4. guide
5. concept
6. faq / notes

### 11.2 Fuente de verdad

El campo `source_of_truth: true` debe reservarse a documentos realmente canónicos.

### 11.3 Vigencia

Los documentos deben tener fecha de actualización y ciclo de revisión.

---

## 12. Reglas de redacción para IA

### 12.1 Lenguaje directo

Evitar rodeos innecesarios.

### 12.2 Definiciones explícitas

Cuando aparezca una entidad, definirla cerca de su primera mención.

### 12.3 Términos consistentes

Usar siempre los mismos nombres para las mismas cosas.
Si existen alias, registrarlos en el glosario.

### 12.4 Ejemplos con estructura estable

Los ejemplos deben ser breves, anotados y reutilizables.

### 12.5 Señalización de excepciones

Edge cases, warnings y limitations deben estar claramente etiquetados.

---

## 13. Separación de contenido por intención

No mezclar en el mismo documento:

* teoría con referencia exhaustiva
* how-to con justificación arquitectónica larga
* troubleshooting con onboarding general

La IA recupera mejor cuando la intención del documento es nítida.

---

## 14. Búsqueda híbrida: cómo preparar la documentación

La documentación debe servir tanto a:

* búsqueda semántica
* búsqueda léxica exacta

### 14.1 Para semántica

Usar frases naturales, contexto explícito y descripciones completas.

### 14.2 Para léxico

Incluir nombres exactos, endpoints, clases, flags, comandos, identificadores, nombres de tablas y rutas.

### 14.3 Keywords explícitas

Agregar keywords en metadata para términos críticos o alias frecuentes.

---

## 15. Jerarquía óptima de recuperación

Cuando el corpus crece, la IA no debe empezar leyendo contenido bruto.

Secuencia recomendada:

1. overview general
2. filtrado por metadata
3. candidate retrieval por título, tags y resumen
4. lectura de chunks relevantes
5. expansión por enlaces relacionados solo si hace falta

Esto reduce costo y evita sobrecargar contexto.

---

## 16. Gobernanza documental

### 16.1 Owners claros

Todo documento debe tener responsable.

### 16.2 Revisión periódica

Los documentos críticos deben revisarse con ciclo fijo.

### 16.3 Deprecación explícita

Cuando un documento deja de ser válido, no se borra silenciosamente.
Debe marcarse y apuntar al reemplazo.

### 16.4 Pull requests documentales

Cambios de arquitectura, APIs o procesos deben acompañarse con actualización documental.

---

## 17. Plantillas mínimas sugeridas

### 17.1 Concept

* qué es
* por qué existe
* cómo se relaciona con el sistema
* límites
* conceptos asociados

### 17.2 Guide

* objetivo
* prerequisitos
* pasos
* validación
* errores comunes
* referencias

### 17.3 Reference

* nombre exacto
* firma / endpoint / esquema
* parámetros
* restricciones
* ejemplos mínimos
* links relacionados

### 17.4 Decision

* contexto
* decisión
* alternativas consideradas
* consecuencias
* fecha

### 17.5 Runbook

* síntoma
* diagnóstico
* pasos de remediación
* validación post-fix
* escalamiento

---

## 18. Señales de mala salud documental

Alertas:

* demasiados archivos `misc`, `notes`, `todo`
* múltiples `final-v2`
* documentos enormes con varios temas
* ausencia de summary y metadata
* conceptos repetidos en distintas rutas
* falta de enlaces entre documentos
* referencia mezclada con narrativa extensa
* documentos sin owner ni fecha

---

## 19. Métricas de calidad

Se puede evaluar el sistema con métricas como:

* tiempo para encontrar respuesta correcta
* cantidad de chunks necesarios por respuesta
* tasa de documentos duplicados
* cobertura de metadata
* porcentaje de docs con owner y review cycle
* cantidad de enlaces rotos
* recall@k y precision@k en retrieval

### Objetivo práctico

Idealmente, una pregunta frecuente no debería requerir más de 3 a 5 chunks relevantes.

---

## 20. Regla maestra operativa

**Organizar por semántica, dividir por intención, describir con metadata, enlazar como grafo y mantener una fuente única de verdad.**

---

## 21. Protocolo resumido de adopción

1. Definir capas en `docs/`
2. Crear plantillas documentales
3. Exigir metadata obligatoria
4. Nombrar documentos semánticamente
5. Dividir documentos grandes por intención
6. Crear índices maestros y por dominio
7. Marcar canónicos, borradores y deprecated
8. Enlazar documentos relacionados
9. Medir duplicación y salud documental
10. Mantener revisión periódica

---

## 22. Fórmula conceptual final

$$
\text{Calidad documental para IA} \approx
\frac{\text{claridad} + \text{modularidad} + \text{metadata} + \text{enlaces} + \text{canonicidad}}
{\text{duplicación} + \text{ruido} + \text{ambigüedad} + \text{desactualización}}
$$

---

## 23. Definición final del protocolo

Un sistema documental orientado a IA es un conjunto de documentos modulares, canónicos y enlazados, organizados por capas semánticas, enriquecidos con metadata estructurada y redactados para maximizar su recuperabilidad, minimizar el ruido contextual y sostener búsquedas híbridas de alta precisión.

## Related docs

- [Registro de prefijos DOC](id-registry.md) (`DOC-META-002`)
- [README del portal `docs/`](../README.md)
