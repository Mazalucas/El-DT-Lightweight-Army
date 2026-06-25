# Especificación — configuración upstream DT

Contrato para repos **consumidores** (proyecto propio + DT embebido). La IA lee y escribe **`vitals/config/dt-upstream.md`** (Markdown con frontmatter YAML).

## Archivo consumidor

Path: `vitals/config/dt-upstream.md` (versionado en el repo del producto).

Plantilla: [`vitals/config/dt-upstream.example.md`](../config/dt-upstream.example.md).

## Campos (frontmatter)

| Campo | Valores | Uso |
|-------|---------|-----|
| `version` | `1` | Schema |
| `mode` | `consumer` \| `canonical` | `canonical` = repo plantilla; omitir Fase B de `/actualizar` |
| `framework_version` | semver string | Última versión DT incorporada. Tras `/bootstrap` vive aquí (no en `VERSION` raíz del proyecto) |
| `source.remote` | nombre Git | Default: `dt-upstream` |
| `source.ref` | rama | Fallback si no hay tags (`main`) |
| `preserve_paths` | lista paths | Docs/archivos locales que `/actualizar-dt` no sobrescribe |

## Remote Git

Fuente de verdad de la URL: `git remote get-url dt-upstream`. **No hardcodear URLs en skills.**

Registro automático: `/bienvenida` o `/bootstrap` (ver skills `dt-setup`, `dt-bootstrap`).

## Estado local (no commitear)

Path: `vitals/ops/dt-upstream-state.md` — plantilla [`dt-upstream-state.example.md`](../ops/dt-upstream-state.example.md).

Campos: `last_check`, `snooze_until` (ISO8601).

## Skills

- Fase B consulta: [`.cursor/skills/git-actualizar/references/upstream-check.md`](../../.cursor/skills/git-actualizar/references/upstream-check.md)
- Apply: [`.cursor/skills/dt-actualizar/references/sync-from-upstream.md`](../../.cursor/skills/dt-actualizar/references/sync-from-upstream.md)
- Manifiesto paths: [`.cursor/skills/dt-actualizar/references/sync-paths.md`](../../.cursor/skills/dt-actualizar/references/sync-paths.md)
