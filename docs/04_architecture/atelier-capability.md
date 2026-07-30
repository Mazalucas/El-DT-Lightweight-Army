---
id: DOC-ARCH-002
title: Arquitectura de la capacidad Atelier
type: architecture
status: canonical
owner: dt-platform
created: 2026-06-13
updated: 2026-06-25
tags:
  - design
  - architecture
  - atelier
  - impeccable
summary: Atelier 2.0 — Impeccable vendoreado + pack design/ nativo + sync pipeline.
related:
  - DOC-DESIGN-001
  - DOC-DEC-003
  - DOC-DEC-004
  - DOC-GUIDE-008
priority: high
source_of_truth: true
---

# Arquitectura Atelier

```text
                    ┌─────────────────────────────────────┐
                    │  tools/atelier/upstream (submodule) │
                    └──────────────┬──────────────────────┘
                                   │ sync-from-impeccable.sh
                    ┌──────────────▼──────────────────────┐
                    │  generated/ + overlays/ (DT)        │
                    └──────────────┬──────────────────────┘
                                   │
Usuario → /atelier ──► .cursor/skills/atelier/SKILL.md (23+ commands)
              │
              ├─ design-context (.agents/design-context.md)
              ├─ dt-design-select.rb ← vitals/data/design/
              ├─ design/{skill}/ (systems, styles, patterns)
              ├─ atelier-detect.sh → impeccable CLI
              ├─ craft → código UI directo
              └─ frontend (integración / E2E cuando aplica)
```

## Capas

| Capa | Path | Rol |
|------|------|-----|
| Upstream | `tools/atelier/upstream/` | Impeccable @ skill-v* tag |
| Generated | `tools/atelier/generated/` | references + scripts (sync only) |
| Overlays | `tools/atelier/overlays/` | init/craft/design-context DT |
| Runtime skill | `.cursor/skills/atelier/` | Router compuesto |
| Pack nativo | `.cursor/skills/design/` | DS, styles, templates |

## Pack táctico nativo

`.cursor/skills/design/` — espejo en `.agents/skills/design/` vía `sync-skills-parity.sh` / `sync-ide.sh`.

## Commands

`/atelier` — skill router Impeccable + extensiones DT (`select`, `deck`, `actualizar`).

## Maintainer sync

Ver `DOC-GUIDE-008` · `./tools/atelier/scripts/sync-from-impeccable.sh`

## Spec normativa

`vitals/specs/design-skills-protocol.md`
