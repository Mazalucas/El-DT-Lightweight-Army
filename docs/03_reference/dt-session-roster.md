---
id: DOC-REF-001
title: Referencia — sesión local y roster
type: reference
status: canonical
owner: dt-platform
created: 2026-05-27
updated: 2026-05-27
tags:
  - session
  - roster
  - roles
domain:
  - meta
summary: Forma de session.yaml (local), roster.yaml (Git) y roles opcionales — sin participantes ni roles precargados en la plantilla.
related:
  - DOC-OV-004
keywords:
  - session
  - roster
  - operator
priority: high
intended_audience:
  - engineers
  - ai-agents
source_of_truth: true
review_cycle_days: 90
---

# Sesión local y roster

## Principio

La plantilla **no** trae personas ni roles del equipo. `roster.yaml` arranca con `team: []`. Los roles **no** son un enum fijo del framework: cada proyecto puede dejar texto libre o definir su lista en `vitals/config/roles.yaml`.

## `vitals/ops/session.yaml` (local, .gitignore)

Creado solo por **`/yo`**. Ver forma en [vitals/ops/README.md](../../vitals/ops/README.md).

## `vitals/config/roster.yaml` (Git)

```yaml
version: 1
updated: "<ISO8601 al modificar>"
team:
  - id: <slug>
    name: "<nombre>"
    role: "<rol — texto libre o acordado en roles.yaml>"
    email: "<opcional>"
    registered_at: "<ISO8601>"
```

Solo entradas **reales** añadidas cuando un operador nuevo pasa por `/yo`.

## `vitals/config/roles.yaml` (opcional)

```yaml
version: 1
roles: []   # vacío = cualquier rol en /yo; si hay strings, dt-session valida o sugiere
```

El equipo del **proyecto consumidor** rellena `roles` cuando quiera estandarizar (p. ej. `analista`, `lead`, `platform`). El template base deja `roles: []`.

## Related docs

- [Cerebro del equipo](../00_overview/cerebro-equipo-mecanismos-dt.md) (`DOC-OV-004`)
