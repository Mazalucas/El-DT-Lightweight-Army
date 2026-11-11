---
id: DOC-GUIDE-006
title: "Primer setup El DT — post-clone sin saber Git"
type: guide
status: canonical
owner: dt-platform
created: 2026-06-23
updated: 2026-11-11
tags:
  - onboarding
  - setup
  - bienvenida
  - first-run
domain:
  - meta
summary: Primera vez tras clonar El DT — /bienvenida te guía de a un paso (camino, /yo y /bootstrap si es tu proyecto), sin Ruby ni comandos por IDE.
related:
  - DOC-GUIDE-001
  - DOC-GUIDE-007
  - DOC-OV-004
  - DOC-OPS-001
keywords:
  - clone
  - bienvenida
  - yo
  - onboarding
priority: high
intended_audience:
  - engineers
  - ai-agents
  - non-developers
source_of_truth: true
review_cycle_days: 90
---

# Primer setup El DT — post-clone

## Summary

Tras clonar el repo, escribí **`/bienvenida`**: el DT te guía de a un paso. No necesitás Ruby, npm ni elegir IDE — el DT ya trae la estructura multi-IDE en Git.

## Pasos (tarjeta)

```text
1. git clone <url-del-repo>
2. cd <carpeta-del-repo>
3. Abrí Cursor, Antigravity, Claude Code u otro IDE soportado
4. En el chat: /bienvenida → elegí 1, 2 o 3
5. /yo → "Soy Ana García, analista"
6. Si es tu proyecto: /bootstrap → /yo otra vez
7. Trabajá y al cerrar: /guardar
```

**`/actualizar`** sincroniza tu proyecto y avisa si hay release nuevo del framework DT (→ `/actualizar-dt`). No en un clone recién hecho salvo que el remoto ya tenga novedades.

## Qué hace `/bienvenida`

Es una charla corta. La IA revisa la estructura en silencio, se presenta (quién es, para qué está y en qué te ayuda) y te hace **una** pregunta: qué querés hacer (construir tu proyecto, conocer el DT o mantener el DT oficial). Después te guía de a un paso: `/yo` y, si es tu proyecto, `/bootstrap` y otra vez `/yo`. Cada paso te dice **qué hacemos** y **por qué sirve**. Al final te muestra **qué más podés hacer** y el ritual diario. Si falta estructura, te pide **`/setup`**. **No** instala nada ni borra carpetas; solo registra el upstream del DT y el hook `pre-push`, local y sin commit.

Si abrís el repo por primera vez **sin** haber corrido `/yo`, la IA puede arrancar la misma charla por su cuenta.

Si algo falta → te lo dice en español claro; **`/setup`** repara drift; re-clonar solo si el clone está roto.

## Qué hace `/yo`

Crea tu identidad **solo en esta PC** (`vitals/ops/session.yaml`). No va a GitHub.

## Qué NO se toca

| Path | Motivo |
|------|--------|
| `vitals/ops/session.yaml` | Solo local |
| `.env`, credenciales | Secretos |
| `vitals/workspace.yaml` | Multi-repo local |

## Si algo no carga después de un pull grande

Usá **`/setup`** (repair) — requiere Ruby en la máquina; ver [ide-setup.md](ide-setup.md) (`DOC-GUIDE-001`).

## Ritual diario (después del primer día)

```text
/actualizar  →  /yo  →  trabajar  →  /guardar
```

## Related docs

- [Actualizar framework DT](actualizar-framework-dt.md) (`DOC-GUIDE-007`)
- [Configuración multi-IDE](ide-setup.md) (`DOC-GUIDE-001`)
- [Memoria del equipo](../00_overview/memoria-equipo-mecanismos-dt.md) (`DOC-OV-004`)
- [Colaboración Git](../06_operations/git-colaboracion-dt.md) (`DOC-OPS-001`)
