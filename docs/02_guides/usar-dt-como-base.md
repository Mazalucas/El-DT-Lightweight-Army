---
id: DOC-GUIDE-004
title: Usar El DT como base de un proyecto (bootstrap / detach)
type: guide
status: canonical
owner: dt-platform
created: 2026-06-13
updated: 2026-06-13
tags:
  - bootstrap
  - detach
  - git
  - setup
domain:
  - meta
summary: Cómo convertir el template El DT en la base de tu propio proyecto promoviéndolo al raíz y soltando el remoto del template, de forma segura (dry-run y confirmación).
related:
  - DOC-GUIDE-001
  - DOC-GUIDE-003
  - DOC-GUIDE-007
  - DOC-OV-004
keywords:
  - bootstrap
  - usar-como-base
  - git remote remove
  - dt-bootstrap
priority: high
intended_audience:
  - engineers
  - ai-agents
source_of_truth: true
review_cycle_days: 90
---

# Usar El DT como base de un proyecto

## Summary

`/bootstrap` (skill `dt-bootstrap`) convierte el template en la base de tu proyecto: lo promueve a la raíz, suelta el remoto del template y deja el repo listo para tu trabajo. Es **irreversible** → siempre con dry-run, confirmación explícita y working tree limpio.

## Purpose

Evitar el flujo manual y propenso a errores de "clonar, borrar el `.git`, reconectar el remoto" cuando alguien quiere arrancar un proyecto nuevo desde El DT.

## Scope

**Cubre:** promoción al raíz, registro de `dt-upstream`, detach del remoto, reset de estado de ejemplo, setup del IDE.
**No cubre:** crear el repo remoto destino (eso lo hacés en tu proveedor Git).

## Prerequisitos

- Sesión válida (`/yo`).
- Working tree limpio (`git status`).

## Pasos

1. **Dry-run**: el DT lista qué se mueve, registro de `dt-upstream`, qué remoto se suelta y qué se resetea. No ejecuta hasta tu OK.
2. **Promover al raíz** (si el DT está en subcarpeta).
3. **Registrar upstream** (antes de soltar `origin`): `git remote add dt-upstream "$(git remote get-url origin)"` y crear `vitals/config/dt-upstream.md` con `framework_version` = `VERSION` actual (ver `dt-upstream.example.md`).
4. **Soltar remoto del template**: `git remote remove origin` (ofrece reconectar a tu repo o `git init` fresco).
5. **Reset de estado**: `VERSION` del **proyecto** → `0.1.0`; versión del **framework** en `framework_version` de `vitals/config/dt-upstream.md`; crear `vitals/config/project-version.yaml` (discover `package.json`, `auto_bump: none`, `./scripts/project-sync-version.sh`); `roster.yaml` (`team: []`), pulse de ejemplo, banner/README.
6. **Garantizar IDE**: corre `/setup` (skill `dt-setup`) para el/los IDE(s) elegido(s).
7. **Verificar**: `./scripts/dt-doctor.sh` en verde.

## Validación

- `git remote -v` muestra tu remoto en `origin` y el template en `dt-upstream`.
- `dt-doctor` en verde.

## Errores comunes

- Working tree sucio → `git stash` o `/guardar` antes de bootstrap.
- Colisión de archivos al promover al raíz → el DT pregunta antes de pisar.

## Related docs

- [Actualizar framework DT](actualizar-framework-dt.md) (`DOC-GUIDE-007`)
- [Configuración multi-IDE](ide-setup.md) (`DOC-GUIDE-001`)
- [Adoptar El DT en un repo existente](adopt-dt-in-existing-repo.md) (`DOC-GUIDE-003`)
- [Cerebro del equipo](../00_overview/cerebro-equipo-mecanismos-dt.md) (`DOC-OV-004`)
