# Atelier — Atribución Impeccable

Atelier 2.0 incorpora componentes de [Impeccable](https://github.com/pbakaus/impeccable) (Apache License 2.0).

## Qué viene de Impeccable (vendoreado / sync)

| Artefacto | Origen | Actualización |
|-----------|--------|---------------|
| `generated/references/*.md` | `upstream/skill/reference/` | `sync-from-impeccable.sh` |
| `generated/scripts/*` (excepto adapter) | `upstream/skill/scripts/` | sync script |
| Detector / CLI | npm `impeccable@*` pin en `package.json` | sync `--cli` |
| Hooks | adaptados desde upstream | sync + merge |

## Qué es original El DT

| Artefacto | Ubicación |
|-----------|-----------|
| Overlays DT | `tools/atelier/overlays/` |
| `context.adapter.mjs` | design-context unificado |
| Pack design/ | `.cursor/skills/design/` (systems, styles, templates) |
| Selector Ruby | `scripts/dt-design-select.rb` |
| Starters | `tools/atelier/starters/` |

## Licencia

Impeccable: Copyright Paul Bakaus — Apache 2.0. Ver `upstream/LICENSE`.

El DT overlay y pack nativo: licencia del repositorio El DT.
