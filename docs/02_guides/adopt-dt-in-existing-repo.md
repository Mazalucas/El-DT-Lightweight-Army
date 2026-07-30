---
id: DOC-GUIDE-003
title: "Adoptar El DT en un repositorio existente"
type: guide
status: canonical
owner: dt-platform
created: 2026-04-19
updated: 2026-06-23
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
  - DOC-GUIDE-006
  - DOC-CONCEPT-001
  - DOC-META-001
  - DOC-GUIDE-007
  - DOC-OV-004
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

**Cubre:** copia de carpetas, resolución de conflictos con `.cursor/` o `.agents/` previos, workspace multi-root, versionado por tags del template.

**No cubre:** políticas de CI de terceros ni migración de datos desde otras herramientas.

## Modo drop-in (repo sin rules DT)

1. Copiá desde el template: `.cursor/`, `.agents/` + `.antigravity/`, `vitals/` (`config/commands-meta.yaml`, `config/dt-upstream.example.md`, `config/roster.yaml`, `config/roles.yaml` vacíos, `ops/README.md`), `AGENTS.md`, `vitals/specs/dt-upstream-config.md`, y lo que necesités de `docs/99_meta/` y `scripts/`.
2. Configurá upstream: `git remote add dt-upstream <url-repo-canónico-DT>` y copiá `dt-upstream.example.md` → `vitals/config/dt-upstream.md` con `mode: consumer` y `framework_version` del tag adoptado.
3. Ritual primera vez: **`/bienvenida`** → **`/yo`** → `/guardar` cuando corresponda (ver `DOC-GUIDE-006`).
4. Ritual diario: `/actualizar` → `/yo` → `/guardar` (ver `DOC-OV-004`).
5. Registrá un primer pulso opcional en `vitals/pulse/entries/` y actualizá `vitals/pulse/current.md`.
6. Paridad IDE (maintainers): `./scripts/sync-commands-from-meta.sh` y `./scripts/sync-skills-parity.sh` tras cambiar meta o skills.

## Adopción mínima (solo ritual Git)

Si el repo **no** necesita cuadernos personales ni pulse compartido aún, copiá solo:

| Incluir | Omitir (opcional) |
|---------|-------------------|
| Rules `00`–`06`, `90` | `vitals/work/inbox/` (crear bajo demanda con `/yo`) |
| `vitals/config/roster.yaml`, `roles.yaml` (vacíos) | Pulse entries hasta que el equipo los use |
| `vitals/config/commands-meta.yaml` | Subagentes que no vais a invocar |
| Skills `git-actualizar`, `git-guardar`, `dt-session`, `dt-actualizar` | `github-save-release` si no versionáis con tag |
| Commands/workflows de rutina + `AGENTS.md` | Duplicar los 20 subagentes si ya tenéis especialistas propios |

Ritual igual: **`/actualizar` → `/yo` → trabajar → `/guardar`**. Tras editar `commands-meta.yaml`, corré `./scripts/sync-commands-from-meta.sh`.

## Modo merge (ya existen rules o commands)

1. **No sobrescribir** sin revisión: renombrá archivos conflictivos a `*.bak` o fusioná manualmente reglas con el mismo tema.
2. Integrá el catálogo `03-catalogo-subagentes` con vuestros subagentes: renumerá si hace falta para evitar duplicados de `description`.
3. Corré `./scripts/sync-ide.sh` después de editar `vitals/specs/rule-bodies/` para regenerar todas las rules en todos los IDEs.
4. Corré `./scripts/sync-commands-from-meta.sh` y `./scripts/sync-skills-parity.sh` después de editar meta o skills.

## Modo monorepo / multi-root

1. El DT en la **raíz** del workspace; paquetes hijos pueden tener reglas locales — declará **alcance de carpeta** al planificar (`/orquestar`, Mapear).
2. Si hay **varios repos Git** en el mismo workspace, copiá `vitals/workspace.yaml.example` → `vitals/workspace.yaml` y listá `projects[]`, `default_project` y `aliases`.
3. Ante pedidos Git ambiguos (“commiteá”) sin nombre de proyecto, el DT debe **preguntar** o inferir según `05-multi-project-git` (ver `vitals/specs/multi-project.md`).

## Versionado del template

Al copiar desde El DT, anotá el **tag o commit** del template en el README del proyecto consumidor para saber qué versión de normativa tenés.

## Validación

- Abrí `vitals/INDEX.md` y verificá que los enlaces resuelven.
- En Cursor: Project Rules cargan `00`–`06` y documentación.
- En Antigravity: `.antigravity/rules.md` lista skills en `.agents/skills/` y workflows en `.agents/workflows/`.
- `./scripts/sync-commands-from-meta.sh --check` termina sin drift.

## Related docs

- [Actualizar framework DT](actualizar-framework-dt.md) (`DOC-GUIDE-007`)
- [Configuración multi-IDE](ide-setup.md) (`DOC-GUIDE-001`)
- [Vitals — concepto](../01_concepts/dt-vitals.md) (`DOC-CONCEPT-001`)
