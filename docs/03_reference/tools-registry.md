---
id: DOC-REF-007
title: Registro de tools reutilizables
type: reference
status: canonical
owner: dt-platform
created: 2026-06-19
updated: 2026-09-23
tags:
  - tools
  - remotion
  - atelier
  - data
  - agents
domain:
  - reference
summary: Referencia estable del catálogo tools/ — elección de carril de video, Remotion, Atelier/Impeccable.
related:
  - DOC-REF-006
  - DOC-REF-008
  - DOC-GUIDE-008
  - DOC-OV-004
priority: high
intended_audience:
  - engineers
  - ai-agents
source_of_truth: true
review_cycle_days: 90
---

# Registro de tools reutilizables

Referencia humana de la capa **`tools/`** en la raíz del repo. Catálogo vivo (tablas, paths): [`tools/REGISTRY.md`](../../tools/REGISTRY.md).

## Modelo de capas

| Capa | Path | Rol |
|------|------|-----|
| Mantenimiento DT | `scripts/` | sync-ide, dt-doctor, catálogo docs |
| **Tools** | `tools/` | Plantillas y primitivas que los agentes reutilizan |
| Comportamiento | `.cursor/skills/` | Protocolos, discover, vendor skills |
| Generaciones | `output/`, `temporal/` | **No versionar** — gitignored |

## Video — elección de carril

[`tools/video/ROUTING.md`](../../tools/video/ROUTING.md) es la matriz. Skill `video-routing`. La primera fila que cierra gana. Hyperframes no es el motor por defecto.

| Carril | Cómo se usa | Peso en git |
|--------|-------------|-------------|
| Recordly | `./tools/video/install-recordly.sh` → binario en `output/.cache/recordly/` | Cero. El fuente AGPL no entra al template |
| `/brag` | `./tools/video/install-brag.sh` → `output/.cache/brag/skills/brag/SKILL.md` | Cero. La caché y `brag-output/` están gitignored |
| Hyperframes | `npx hyperframes` en el proyecto del video | Cero. Sin dependencia en el template |
| Remotion | [`tools/remotion/`](../../tools/remotion/) · `/remotion` | Código y lockfile. `node_modules` y MP4 no se versionan |

## Remotion (carril React)

| Artefacto | Path | Consumidor |
|-----------|------|------------|
| Portal | [`tools/remotion/README.md`](../../tools/remotion/README.md) | `remotion-producer`, `marketing/video` |
| Starter | [`tools/remotion/starter/`](../../tools/remotion/starter/) | Scaffold vía `tools/remotion/scripts/scaffold.sh` |
| Primitivas | [`tools/remotion/primitives/`](../../tools/remotion/primitives/) | Copiar a `src/components/remotion/` del proyecto |
| Vendor rules | [`.cursor/skills/remotion-best-practices/`](../../.cursor/skills/remotion-best-practices/) | Reglas `remotion-dev/skills` |
| Subagente | [`.cursor/agents/remotion-producer.md`](../../.cursor/agents/remotion-producer.md) | Orquestación |
| Command | `/remotion` | `vitals/config/commands-meta.yaml` |

### Flujo

```text
marketing-strategist lee tools/video/ROUTING.md
carril remotion → remotion-producer → tools/remotion/primitives → proyecto consumidor
render → output/remotion/*.mp4 (local, gitignored)
```

### Licencia

Remotion: gratis ≤3 personas; ver [remotion.dev/license](https://www.remotion.dev/docs/license).

## Atelier / Impeccable (implementado)

| Artefacto | Path | Consumidor |
|-----------|------|------------|
| Portal | [`tools/atelier/README.md`](../../tools/atelier/README.md) | `ui-designer`, `/atelier` |
| Upstream | [`tools/atelier/upstream/`](../../tools/atelier/upstream/) | Submodule `pbakaus/impeccable` @ skill-v* |
| Generated | [`tools/atelier/generated/`](../../tools/atelier/generated/) | references + scripts (sync only) |
| Overlays DT | [`tools/atelier/overlays/`](../../tools/atelier/overlays/) | design-context, craft |
| Detect | [`scripts/atelier-detect.sh`](../../scripts/atelier-detect.sh) | Impeccable CLI wrapper |
| Router skill | [`.cursor/skills/atelier/`](../../.cursor/skills/atelier/) | 23+ commands |
| Design pack | [`.cursor/skills/design/`](../../.cursor/skills/design/) | DS, styles, templates (DT nativo) |

### Sync maintainer

Ver [atelier-impeccable-sync.md](../02_guides/atelier-impeccable-sync.md) (`DOC-GUIDE-008`).

## Datos / verificación numérica (implementado)

| Artefacto | Path | Consumidor |
|-----------|------|------------|
| CLI verify-csv | [`tools/data/verify-csv.py`](../../tools/data/verify-csv.py) | `data-auditor`, `/verificar` |
| Docs | [`tools/data/README.md`](../../tools/data/README.md) | `data-auditor` |
| Skill de rol | [`.cursor/skills/data-auditor/`](../../.cursor/skills/data-auditor/) | Recetas por runtime |
| Regla | `16-numeric-grounding` | Todos los agentes (always-on) |

Referencia: [numeric-verification-default.md](numeric-verification-default.md) (`DOC-REF-009`).

## Integraciones marketing (stub)

Skills en `.cursor/skills/marketing/` referencian `tools/integrations/*.md`. Esas guías se añaden por demanda; [`tools/REGISTRY.md`](../../tools/REGISTRY.md) documenta el estado.

## Related docs

- [Ingeniería reuse-first](engineering-reuse-default.md) (`DOC-REF-006`)
- [Portal tools](../../tools/README.md)
