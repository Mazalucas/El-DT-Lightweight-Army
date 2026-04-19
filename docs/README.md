---
id: DOC-OV-001
title: Portal de documentación del proyecto
type: overview
status: canonical
owner: dt-platform
created: 2026-04-19
updated: 2026-04-19
tags:
  - documentation
  - index
domain:
  - meta
summary: Punto de entrada a la documentación por capas, rutas por intención y enlaces canónicos.
related:
  - DOC-META-001
  - DOC-GUIDE-001
  - DOC-CONCEPT-001
  - DOC-GUIDE-003
keywords:
  - docs
  - index
priority: high
intended_audience:
  - engineers
  - ai-agents
source_of_truth: true
review_cycle_days: 90
---

# Documentación del proyecto

## Propósito

Esta carpeta `docs/` organiza el conocimiento por **capas semánticas** y **tipos documentales**, con metadata estable y enlaces explícitos. El estándar completo está en [99_meta/protocolo-documentacion-ia.md](99_meta/protocolo-documentacion-ia.md) (`DOC-META-001`).

## Mapa por capas

| Capa | Ruta | Contenido |
|------|------|-----------|
| Overview | [00_overview/](00_overview/) | Índices, quickstart, mapa del repo |
| Conceptos | [01_concepts/](01_concepts/) | Qué es / por qué existe |
| Guías | [02_guides/](02_guides/) | Cómo hacer X |
| Referencia | [03_reference/](03_reference/) | Lookup técnico estable |
| Arquitectura | [04_architecture/](04_architecture/) | Componentes, límites, diagramas |
| Decisiones | [05_decisions/](05_decisions/) | ADRs |
| Operaciones | [06_operations/](06_operations/) | Runbooks, despliegue, incidentes |
| Glosario | [07_glossary/](07_glossary/) | Términos y alias |
| Meta | [99_meta/](99_meta/) | Protocolo, plantillas, registro de IDs |

## Rutas por tipo de pregunta

- **Si querés entender el protocolo documental y cómo escribir para IA:** [99_meta/protocolo-documentacion-ia.md](99_meta/protocolo-documentacion-ia.md)
- **Si querés configurar Cursor vs Antigravity en este repo:** [02_guides/ide-setup.md](02_guides/ide-setup.md)
- **Si querés adoptar El DT en un repo que ya existe:** [02_guides/adopt-dt-in-existing-repo.md](02_guides/adopt-dt-in-existing-repo.md)
- **Si querés entender Vitals (pulse, memoria, specs del orquestador):** [01_concepts/dt-vitals.md](01_concepts/dt-vitals.md)
- **Si querés registrar un prefijo nuevo para IDs `DOC-<DOMINIO>`:** [99_meta/id-registry.md](99_meta/id-registry.md)
- **Si querés el catálogo de documentos indexados:** [99_meta/catalog.yaml](99_meta/catalog.yaml)

## Documentos canónicos clave

| ID | Documento |
|----|-----------|
| DOC-META-001 | [Protocolo de documentación orientada a IA](99_meta/protocolo-documentacion-ia.md) |
| DOC-META-002 | [Registro de prefijos DOC](99_meta/id-registry.md) |
| DOC-OV-001 | Este README (portal) |
| DOC-GUIDE-001 | [Configuración multi-IDE](02_guides/ide-setup.md) |
| DOC-CONCEPT-001 | [Vitals — telemetría y normativa DT](01_concepts/dt-vitals.md) |
| DOC-GUIDE-003 | [Adoptar El DT en un repo existente](02_guides/adopt-dt-in-existing-repo.md) |

## Related docs

- [Plantillas en 99_meta/templates/](99_meta/templates/)
