---
id: DOC-REF-008
title: Atelier detector y lock Impeccable
type: reference
status: canonical
owner: dt-platform
created: 2026-06-25
updated: 2026-06-25
tags:
  - atelier
  - detector
  - impeccable
summary: Contrato de atelier-detect.sh, atelier-detector.yaml e impeccable-lock.yaml.
related:
  - DOC-GUIDE-008
  - DOC-DEC-004
priority: medium
source_of_truth: true
---

# Atelier detector y vendor lock

## Detector CLI

```bash
./scripts/atelier-detect.sh [path]
./scripts/atelier-detect.sh --json src/
```

Delega a `tools/atelier/node_modules/.bin/impeccable detect`.

Config: `vitals/data/design/atelier-detector.yaml`

## Lock file

Path: `tools/atelier/impeccable-lock.yaml`

| Campo | Descripción |
|-------|-------------|
| `skill_tag` | Tag submodule Impeccable |
| `cli_version` | Pin npm `impeccable` |
| `submodule_sha` | Commit exacto |
| `reference_count_min` | Mínimo para dt-doctor |

## Hooks

`.cursor/hooks.json` → `tools/atelier/generated/scripts/hook-before-edit.mjs`

Opt-out: `detector.hook.enabled: false` en config (futuro) o remover hook entry.

## Deprecated

`./scripts/dt-design-detect.sh` — alias a `atelier-detect.sh`.
