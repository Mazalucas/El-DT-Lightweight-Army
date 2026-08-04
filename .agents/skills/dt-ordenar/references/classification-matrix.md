# Matriz de clasificación — /ordenar

Referencia para **Fase 2** del skill `dt-ordenar`. Autoridad: DOC-META-001 §2 y regla `02-documentacion`.

## Pregunta → capa

| Pregunta del operador | Capa | Tipo habitual | ID prefijo |
|-----------------------|------|---------------|------------|
| ¿Qué es el proyecto / mapa? | `00_overview/` | overview | DOC-OV-* |
| ¿Qué es X / por qué existe? | `01_concepts/` | concept | DOC-CONCEPT-* |
| ¿Cómo hago X? | `02_guides/` | guide | DOC-GUIDE-* |
| ¿Cuál es el contrato / flag / endpoint? | `03_reference/` | reference | DOC-REF-* |
| ¿Cómo está armado el sistema? | `04_architecture/` | architecture | DOC-ARCH-* |
| ¿Por qué elegimos X? | `05_decisions/` | decision (ADR) | DOC-DEC-* |
| ¿Cómo opero / runbook? | `06_operations/` | runbook | DOC-OPS-* |
| ¿Qué significa este termino? | `07_glossary/` | glossary | DOC-GLOSS-* |
| Meta / protocolo docs | `99_meta/` | policy | DOC-META-* |

## Acción por situación

| Situación | Acción | Destino |
|-----------|--------|---------|
| Ya existe doc canónico del tema | `merge` | Enlazar + ampliar sección; no segundo doc |
| Dump crudo, CSV enorme, logs | `archive` | `sources/` + resumen en `docs/` |
| Apunte personal, ideas sueltas | `create` | `vitals/work/inbox/{id}/` |
| Patrón repetido del DT (regla) | `defer` | Propuesta en `vitals/memory/inbox/` **solo con evidencia** |
| Borrador explícito no listo para Git | `archive` | `draft-ordenar-*` bajo inbox (no versionado) |
| Evento de orquestación relevante | `create` | `vitals/pulse/entries/` (breve) |

## Anti-patrones

- Un solo `.md` de 500+ líneas con todo mezclado → **partir** y enlazar.
- Copiar README del vendor sin `summary` propio → **destilar** + enlace externo.
- Duplicar ADR en guide y concept → **un canónico**, el otro enlaza.
- Secretos o PII en `sources/` → redactar; nunca commitear tokens.

## Retrieval (cómo encontrar después)

Cada doc nuevo debe tener:

- `summary` que funciona solo
- `keywords` (3–8)
- `related` con IDs existentes
- Manifest de sesión con tabla **path → ID → keywords**
