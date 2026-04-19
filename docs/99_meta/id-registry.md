---
id: DOC-META-002
title: Registro de prefijos DOC-<DOMINIO>
type: reference
status: canonical
owner: dt-platform
created: 2026-04-19
updated: 2026-04-19
tags:
  - documentation
  - ids
domain:
  - meta
summary: Prefijos permitidos para IDs DOC-<DOMINIO>-<NNN>. Registrar una fila antes de emitir el primer ID en un prefijo nuevo.
related:
  - DOC-META-001
keywords:
  - id
  - registry
  - domain
priority: high
intended_audience:
  - engineers
  - ai-agents
source_of_truth: true
review_cycle_days: 90
---

# Registro de prefijos `DOC-<DOMINIO>`

Antes de crear un documento con un prefijo nuevo, añadí una fila a esta tabla (PR o commit con contexto).

| Prefijo (`DOMINIO`) | Descripción | Ejemplos |
|---------------------|-------------|----------|
| META | Meta-documentación, protocolo, políticas editoriales | DOC-META-001 |
| GUIDE | Guías how-to del repositorio / DT | DOC-GUIDE-001 … DOC-GUIDE-003 |
| OV | Overview, índices de capa, quickstart, portal `docs/README` | DOC-OV-001 … DOC-OV-009 |
| CONCEPT | Conceptos en `01_concepts` | DOC-CONCEPT-001 |
| REF | Referencia técnica en `03_reference` | DOC-REF-001 |
| ARCH | Arquitectura en `04_architecture` | DOC-ARCH-001 |
| DEC | Decisiones / ADRs en `05_decisions` | DOC-DEC-001 |
| OPS | Operaciones, runbooks en `06_operations` | DOC-OPS-001 |
| GLOSS | Glosario en `07_glossary` | DOC-GLOSS-001 |

**Convención:** `DOC-<DOMINIO>-<NNN>` con `NNN` numérico de al menos tres dígitos (001, 002, …). Mismo dominio puede tener muchos números.

## Related docs

- [Protocolo de documentación orientada a IA](protocolo-documentacion-ia.md) (`DOC-META-001`)
