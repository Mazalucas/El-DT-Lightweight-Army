---
id: DOC-GUIDE-001
title: Configuración multi-IDE — Cursor y Antigravity
type: guide
status: canonical
owner: dt-platform
created: 2026-04-19
updated: 2026-04-20
tags:
  - cursor
  - antigravity
  - setup
domain:
  - meta
summary: Cómo ejecutar el setup del IDE al clonar o cambiar entre Cursor y Antigravity sin conflictos.
related:
  - DOC-OV-001
  - DOC-GUIDE-003
  - DOC-CONCEPT-001
keywords:
  - setup-cursor
  - setup-antigravity
  - IDE
priority: high
intended_audience:
  - engineers
  - ai-agents
source_of_truth: true
review_cycle_days: 90
---

# Configuración multi-IDE: Cursor y Antigravity

## Summary

El DT (Director Técnico) soporta **Cursor** y **Antigravity**. El repositorio incluye configuración para ambos IDEs. Para evitar conflictos, ejecutá el comando de setup del IDE que vas a usar.

## Purpose

Evitar reglas o skills duplicadas o contradictorias al trabajar con un solo IDE.

## Scope

**Cubre:** flujo de setup al clonar o al cambiar de IDE, restauración por git.  
**No cubre:** instalación del IDE ni cuentas.

## Cuándo ejecutar el setup

- **Al clonar** el repositorio por primera vez
- **Al cambiar de IDE** (por ejemplo, pasás de Cursor a Antigravity)

## Comandos de setup

### Si usás Cursor

Ejecutá el comando `/setup-cursor` en el chat del agente.

**Qué hace:** Pone **`.cursorrules`** en modo solo Cursor (copiando `docs/99_meta/cursorrules.cursor.md`), elimina `.agent/` y `.antigravity/`, y deja solo `.cursor/` para rules/commands del DT.

### Si usás Antigravity

Ejecutá el workflow `/setup-antigravity` en el chat del agente.

**Qué hace:** Pone **`.cursorrules`** en modo solo Antigravity (copiando `docs/99_meta/cursorrules.antigravity.md`), elimina `.cursor/`, y deja solo `.agent/` y `.antigravity/`.

## `.cursorrules` y plantillas (multi-IDE vs un IDE)

- **Repo completo (sin setup):** el **`.cursorrules`** en la raíz usa la plantilla **dual**: “si usás Cursor… / si usás Antigravity…”.
- **Tras un setup:** el agente debe reemplazar **`.cursorrules`** por la plantilla que corresponda (archivos en **`docs/99_meta/`**):
  - `cursorrules.dual.md` — ambos IDEs (referencia / restauración)
  - `cursorrules.cursor.md` — foco Cursor
  - `cursorrules.antigravity.md` — foco Antigravity

Las plantillas viven bajo **`docs/99_meta/`** para que **no se pierdan** cuando se borra `.cursor/` o `.agent/`.

## Advertencia

**No ejecutes el setup sin intención explícita.** Los comandos eliminan carpetas del proyecto. La IA te pedirá confirmación antes de proceder.

## Cómo restaurar

Si ejecutaste el setup por error o querés volver a tener ambas configuraciones:

- **Restaurar Antigravity** (después de setup-cursor): `git checkout .agent .antigravity`
- **Restaurar Cursor** (después de setup-antigravity): `git checkout .cursor`
- **Volver al texto dual de `.cursorrules`:** copiá `docs/99_meta/cursorrules.dual.md` a `.cursorrules` o `git checkout .cursorrules` si aún tenés el historial.

## Validación

Tras el setup, solo debe existir la familia de carpetas del IDE elegido (tabla siguiente).

## Estructura según IDE

| IDE | Carpetas activas |
|-----|------------------|
| Cursor | `.cursor/` (rules, commands, agents) + `vitals/` (compartido) |
| Antigravity | `.agent/` (rules, skills, workflows) + `.antigravity/` (rules.md) + `vitals/` (compartido) |

Tras editar `vitals/specs/rule-bodies/*.body.md`, ejecutá desde la raíz: `./scripts/sync-dt-from-vitals.sh` para regenerar las rules `04` y `05` en ambos IDEs.

## Errores comunes

- Ejecutar setup sin querer → usar `git checkout` según la sección de restauración.

## Related docs

- [Portal de documentación](../README.md) (`DOC-OV-001`)
- [Adoptar El DT en un repo existente](adopt-dt-in-existing-repo.md) (`DOC-GUIDE-003`)
- [Vitals — concepto](../01_concepts/dt-vitals.md) (`DOC-CONCEPT-001`)
