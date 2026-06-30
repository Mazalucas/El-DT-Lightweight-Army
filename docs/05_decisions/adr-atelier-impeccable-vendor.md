---
id: DOC-DEC-004
title: ADR-004 — Vendor Impeccable para Atelier 2.0
type: decision
status: accepted
owner: dt-platform
created: 2026-06-25
updated: 2026-06-25
tags:
  - adr
  - design
  - atelier
  - impeccable
summary: Atelier sincroniza Impeccable vía submodule + npm CLI; overlays DT preservan design-context y pack nativo.
related:
  - DOC-DEC-003
  - DOC-ARCH-002
  - DOC-GUIDE-008
priority: high
source_of_truth: true
---

# ADR-004: Vendor Impeccable para Atelier 2.0

## Contexto

Atelier v1 tenía router fino, detector bash (~42 reglas regex) y skills dispersos. [Impeccable](https://github.com/pbakaus/impeccable) ofrece 23 comandos con playbooks, CLI con 44+ reglas DOM-aware, y hooks. El DT debe **actualizarse fácilmente** cuando Impeccable publique releases.

## Decisión

1. **Sync híbrido:** git submodule `tools/atelier/upstream/` @ tag `skill-v*` + npm pin `impeccable@*` en `tools/atelier/package.json`.
2. **Pipeline:** `sync-from-impeccable.sh` → `generated/` (read-only) + `overlays/` (DT) → compone `.cursor/skills/atelier/SKILL.md`.
3. **Contexto canónico:** `.agents/design-context.md` (overlays init/document); no duplicar PRODUCT.md/DESIGN.md salvo export opcional.
4. **Craft escribe código** — paridad Impeccable; handoff a frontend solo para backend/E2E/refactor.
5. **Detector:** `./scripts/atelier-detect.sh` delega al CLI Impeccable; `dt-design-detect.sh` deprecated alias.
6. **Pack nativo** `.cursor/skills/design/` **se mantiene** (systems, styles, templates).

## Consecuencias

- Pros: updates upstream en un comando; reglas y references mantenidas por Impeccable; hooks Cursor
- Contras: dependencia npm; maintainers necesitan bun solo si tag sin dist prebuilt; submodule size

## Supersede

Parcialmente ADR-003 §4 (detector bash propio) — bash queda como alias deprecated.

## Alternativas rechazadas

- Copiar references a mano en cada release
- Submodule Impeccable sin overlays (pierde design-context unificado)
- Eliminar pack design/ nativo
