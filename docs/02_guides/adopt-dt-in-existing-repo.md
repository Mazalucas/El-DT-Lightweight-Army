---
id: DOC-GUIDE-003
title: "Adoptar El DT en un repositorio existente"
type: guide
status: canonical
owner: dt-platform
created: 2026-04-19
updated: 2026-04-19
tags:
  - adoption
  - cursor
  - antigravity
  - dt
domain:
  - meta
summary: Cómo incorporar la plantilla DT (rules, commands, vitals, docs meta) en un proyecto que ya tiene historial y posiblemente su propia config de IDE.
related:
  - DOC-GUIDE-001
  - DOC-CONCEPT-001
  - DOC-META-001
keywords:
  - merge
  - monorepo
  - multi-root
priority: high
intended_audience:
  - engineers
  - ai-agents
source_of_truth: true
review_cycle_days: 90
---

# Adoptar El DT en un repositorio existente

## Summary

Esta guía describe **tres modos** de adopción — drop-in, merge cuidadoso y monorepo — y cómo evitar pisar configuración existente. Incluye **multi-proyecto** (varios Git roots) mediante `vitals/workspace.yaml` opcional.

## Purpose

Integrar El DT sin romper flujos del equipo y manteniendo trazabilidad (`vitals/pulse`, `docs/` con DOC-META-001).

## Scope

**Cubre:** copia de carpetas, resolución de conflictos con `.cursor/` o `.agent/` previos, workspace multi-root, versionado por tags del template.

**No cubre:** políticas de CI de terceros ni migración de datos desde otras herramientas.

## Modo drop-in (repo sin rules DT)

1. Copiá desde el template: `.cursor/` **o** `.agent/` + `.antigravity/` (según IDE), `vitals/`, y lo que necesités de `docs/99_meta/` y `scripts/`.
2. Ejecutá **`/setup-cursor`** o **`/setup-antigravity`** solo si querés **eliminar** la carpeta del otro IDE en este clon (acción destructiva: confirmar con el equipo).
3. Registrá un primer pulso opcional en `vitals/pulse/entries/` y actualizá `vitals/pulse/current.md`.

## Modo merge (ya existen rules o commands)

1. **No sobrescribir** sin revisión: renombrá archivos conflictivos a `*.bak` o fusioná manualmente reglas con el mismo tema.
2. Integrá el catálogo `03-catalogo-subagentes` con vuestros subagentes: renumerá si hace falta para evitar duplicados de `description`.
3. Corré `./scripts/sync-dt-from-vitals.sh` después de editar `vitals/specs/rule-bodies/` para regenerar rules `04` y `05`.

## Modo monorepo / multi-root

1. El DT en la **raíz** del workspace; paquetes hijos pueden tener reglas locales — declará **alcance de carpeta** al planificar (`/orquestar`, Mapear).
2. Si hay **varios repos Git** en el mismo workspace, copiá `vitals/workspace.yaml.example` → `vitals/workspace.yaml` y listá `projects[]`, `default_project` y `aliases`.
3. Ante pedidos Git ambiguos (“commiteá”) sin nombre de proyecto, el DT debe **preguntar** o inferir según `05-multi-project-git` (ver `vitals/specs/multi-project.md`).

## Versionado del template

Al copiar desde El DT, anotá el **tag o commit** del template en el README del proyecto consumidor para saber qué versión de normativa tenés.

## Validación

- Abrí `vitals/INDEX.md` y verificá que los enlaces resuelven.
- En Cursor: Project Rules cargan `00`–`05` y documentación.
- En Antigravity: `.antigravity/rules.md` apunta a workflows incluyendo `/fast-lane`.

## Related docs

- [Configuración multi-IDE](ide-setup.md) (`DOC-GUIDE-001`)
- [Vitals — concepto](../01_concepts/dt-vitals.md) (`DOC-CONCEPT-001`)
