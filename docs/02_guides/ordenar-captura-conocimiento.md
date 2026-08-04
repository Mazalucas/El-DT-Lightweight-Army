---
id: DOC-GUIDE-016
title: Capturar y ordenar conocimiento con /ordenar
type: guide
status: canonical
owner: dt-platform
created: 2026-08-04
updated: 2026-08-04
tags:
  - documentation
  - ordenar
  - knowledge
  - dt
domain:
  - meta
summary: Cómo volcar archivos, carpetas y dumps del chat al cerebro del repo — clasificación por capas, manifests y retrieval eficiente.
related:
  - DOC-META-001
  - DOC-CONCEPT-001
  - DOC-OV-004
  - DOC-OPS-001
keywords:
  - ordenar
  - captura
  - inbox
  - manifest
  - knowledge
  - documentación
priority: high
intended_audience:
  - engineers
  - ai-agents
source_of_truth: true
review_cycle_days: 90
---

# Capturar y ordenar conocimiento con /ordenar

## Summary

**`/ordenar`** ingiere lo que compartís (texto, archivos, carpetas), clasifica según DOC-META-001, documenta en la capa correcta y deja un **manifest** para encontrar todo después.

## Purpose

- Un ritual para **no perder contexto** del chat en documentación recuperable.
- Separar **conocimiento canónico** (`docs/`) de **material de respaldo** (`vitals/work/knowledge/.../sources/`).
- Maximizar relevancia por token al buscar con IA o navegando el repo.

## Scope

**Cubre:** flujo `/ordenar`, destinos, modos, manifest, relación con inbox y `/guardar`.

**No cubre:** auditoría de seguridad (`/hack`), verificación numérica (`/verificar`), sync de Drive (`/drive`).

## Prerequisitos

1. **`/yo`** — sesión local con `operator.id`.
2. Material sin secretos (o listo para redacción).

## Cuándo usar

| Situación | Command |
|-----------|---------|
| Muchos archivos + contexto en el chat | `/ordenar` |
| Solo clasificar y archivar rápido | `/ordenar quick` |
| Apuntes personales, no doc de equipo | `/ordenar inbox` |
| Forzar docs con frontmatter | `/ordenar docs` |

## Flujo recomendado

```text
1. Preparar inputs (paths, @ archivos, pegar texto)
2. /ordenar [tema opcional] — ej. "/ordenar onboarding cliente X"
3. Revisar plan de archivo (si el DT lo muestra)
4. Confirmar o ajustar destinos
5. /guardar — subir manifests y docs nuevos
```

## Qué hace el DT (6 fases)

1. **Inventario** — lista fuentes y busca duplicados en catálogo.
2. **Plan de archivo** — tabla fuente → capa → acción antes de escribir.
3. **Documentar** — `docs/` con frontmatter; raw grande en `sources/`.
4. **Indexar** — `sync-catalog.rb`, `related`, índices de capa.
5. **Orden DT** — `dt-doctor.sh` una pasada.
6. **Manifest** — `vitals/work/knowledge/YYYY-MM-DD-{slug}/manifest.md`.

Skill operativa: `.cursor/skills/dt-ordenar/SKILL.md`.

## Destinos

| Zona | Uso |
|------|-----|
| `docs/*` | Conocimiento reutilizable del producto/proyecto |
| `vitals/work/knowledge/` | Paquete de sesión + manifest |
| `vitals/work/inbox/{id}/` | Cuaderno personal |
| `vitals/memory/inbox/` | Propuestas de patrón DT (con aprobación humana) |
| `draft-ordenar-*` | Borrador local no versionado |

## Modos

| Modo | Comportamiento |
|------|----------------|
| **deep** (default) | Pipeline completo |
| **quick** | Plan + ≤3 docs; resto en `sources/` |
| **inbox** | Solo cuaderno personal |
| **docs** | Promoción explícita a `docs/` |

## Buenas prácticas

- Dar **tema o slug** en el mensaje: facilita manifest y carpetas.
- Un `/ordenar` por **tema coherente** — mejor retrieval que un mega-dump.
- Si el material es sensible, decirlo antes; el DT redacta y marca en manifest.
- Tras `/ordenar`, correr **`/guardar`** para que el equipo reciba los docs.

## Related docs

- [Protocolo de documentación orientada a IA](../99_meta/protocolo-documentacion-ia.md) (`DOC-META-001`)
- [Vitals — concepto](../01_concepts/dt-vitals.md) (`DOC-CONCEPT-001`)
- [Colaboración Git y zonas](../06_operations/git-colaboracion-dt.md) (`DOC-OPS-001`)
- [Cerebro del equipo](../00_overview/cerebro-equipo-mecanismos-dt.md) (`DOC-OV-004`)
