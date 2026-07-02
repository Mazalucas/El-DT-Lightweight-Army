# Tools registry

Catálogo machine- y human-readable de herramientas reutilizables en `tools/`. Los marketing skills y subagentes enlazan aquí.

> Integraciones SaaS (`tools/integrations/`, `tools/clis/`) están planificadas; hoy solo Remotion está implementado en el template.

## Video programático

| Tool | Path | Agente | Command | Descripción |
|------|------|--------|---------|-------------|
| **Remotion toolkit** | [`remotion/`](remotion/) | `remotion-producer` | `/remotion` | **`cd tools/remotion && npm install && npm run dev`** |
| **Remotion starter** | [`remotion/starter/`](remotion/starter/) | `remotion-producer` | `/remotion init` | Workspace npm — scaffold con `scripts/scaffold.sh` |
| **Remotion primitives** | [`remotion/primitives/`](remotion/primitives/) | `remotion-producer` | `/remotion` | Motion, captions, clay 3D genéricos — copiar a `src/components/remotion/` |
| **Remotion vendor skills** | [`.cursor/skills/remotion-best-practices/`](../.cursor/skills/remotion-best-practices/) | `remotion-producer` | — | Reglas upstream `remotion-dev/skills` |
| **Remotion docs** | [`remotion/README.md`](remotion/README.md) | `remotion-producer`, `marketing-strategist` | — | Flujo scaffold → componer → render |

## Atelier (design intelligence)

| Tool | Path | Agente | Command | Descripción |
|------|------|--------|---------|-------------|
| **Atelier toolkit** | [`atelier/`](atelier/) | `ui-designer` | `/atelier` | Impeccable vendoreado — 23+ commands, craft, detect |
| **Sync Impeccable** | [`atelier/scripts/sync-from-impeccable.sh`](atelier/scripts/sync-from-impeccable.sh) | maintainer | `/atelier actualizar` | Submodule + npm CLI pin |
| **Detect CLI** | [`../scripts/atelier-detect.sh`](../scripts/atelier-detect.sh) | `ui-designer`, `frontend` | `/atelier detect` | Wrapper Impeccable `detect` |
| **Preview demo** | [`atelier/preview/`](atelier/preview/) | humano | `serve-preview.sh` | Hub + 2 demos HTML |
| **Design pack** | [`.cursor/skills/design/`](../.cursor/skills/design/) | `ui-designer` | `/atelier select` | Systems, styles, templates (DT nativo) |

```text
/atelier init → /atelier craft → ./scripts/atelier-detect.sh
Maintainer: ./tools/atelier/scripts/sync-from-impeccable.sh --latest
```

## Flujo agente (Remotion)

```text
marketing-strategist (marketing/video) → guion y copy
        ↓
remotion-producer → tools/remotion/primitives/ + remotion-best-practices
        ↓
scaffold en proyecto consumidor (output/remotion-project o path del usuario)
        ↓
render → output/remotion/*.mp4 (gitignored)
```

## Datos (verificación numérica)

| Tool | Path | Agente | Command | Descripción |
|------|------|--------|---------|-------------|
| **verify-csv** | [`data/verify-csv.py`](data/verify-csv.py) | `data-auditor` | `/verificar` | CSV/TSV: perfil, sumas `Decimal`, subtotales, duplicados, `--assert-total` (stdlib, sin pandas) |
| **Docs** | [`data/README.md`](data/README.md) | `data-auditor` | — | Uso rápido + exit codes; regla `16-numeric-grounding` |

## Integraciones marketing (stub)

Referencias en skills de marketing apuntan a `tools/integrations/*.md`. Esas guías se añadirán por demanda; el enlace a este REGISTRY ya es válido desde la raíz del repo.
