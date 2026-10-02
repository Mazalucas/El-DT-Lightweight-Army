# Especificación — versión del proyecto (`/guardar`)

Contrato: **guardar cambios = bump semver + sync + tag**, después del gate de publicación.

Con cambios hay exactamente un bump, salvo que el gate corte antes (destino = remoto oficial del DT y esta carpeta no está activada con `/oficial`). Sin cambios no hay bump ni commit. El dígito lo elige la IA según el aporte del diff. Si el mensaje nombra patch, minor o major, usa ese y no reclasifica.

## Gate de publicación

Antes del bump, `./scripts/dt-publish-gate.sh`. Contrato: [`canonical-publish.md`](canonical-publish.md).

Exit **30** o **40**: no hay bump, commit, push ni tag, y no se ofrece acceso al repo oficial. Exit **20**: commit local, sin push. Exit **0** o **10**: sigue este spec; el push va al `origin` de este checkout.

## Fuente de verdad

**`VERSION`** (raíz) — semver del **producto de este repo**. El script de sync lo propaga a README y `package.json` del producto.

**`framework_version`** en `vitals/config/dt-upstream.md` — semver del **framework DT** incorporado. Viven aparte. Nunca se copian entre sí.

### Aislamiento (consumer)

En `mode: canonical` el producto es el DT: `resolve` deja `VERSION` como está (coincide con `framework_version`).

En `mode: consumer`, `/guardar` **no** puede imponer el número del DT sobre la app.

1. Correr `./scripts/project-resolve-version.sh` **antes** del bump.
2. Si el producto ya tiene semver (`package.json` en raíz / `frontend` / `backend` / `apps/*`, o un `VERSION` distinto del DT) → esa es la base; después se bump según el dígito.
3. Si no hay semver de producto (proyecto nuevo, o `VERSION` todavía igual a `framework_version` sin app) → `initial_semver` (`0.1.0`). No se hereda el número del DT.
4. `project-bump-version.sh` y `project-sync-version.sh` abortan si `VERSION` sigue igual a `framework_version`.
5. El sync consumer **no** escribe `framework_version` desde `VERSION`.

## Reglas de `/guardar`

1. **Sin cambios** → no bump, no commit.
2. **Con cambios** → resolver VERSION (paso de aislamiento) y un bump. Precedencia del dígito:
   1. El mensaje nombra **patch**, **minor** o **major** (incluye `/guardar release minor|major|patch`). `/guardar release` a secas = **patch**.
   2. Si no, `auto_bump` en `vitals/config/project-version.yaml`:
      - `classify` → la IA clasifica el diff (abajo).
      - `patch` | `minor` | `major` → ese dígito fijo.
      - `none` con `initialized: true` → commit y push **sin** bump ni tag nuevo.
3. **Consumer, proyecto nuevo** (`DT_VERSION_ACTION=initial`) → no incrementa: deja `initial_semver` en `VERSION`, marca `initialized: true` y, si `auto_bump` era `none`, lo pasa a `classify`. Luego sync, commit y tag de esa versión inicial.
4. **Consumer, app con semver** (`DT_VERSION_ACTION=keep`) → no escribas `initial_semver` ni el número del DT. Base = versión de la app; bump con el dígito.
5. **Sync** → `./scripts/project-sync-version.sh` tras el bump (o tras el reset inicial). En consumer no toca `framework_version`.
6. **Commit** → empieza con `v{X.Y.Z}:` (versión ya escrita). Cuerpo con `Bump: {dígito} — {motivo}`.
7. **Tag** → `./scripts/dt-tag-version.sh --push` tras push OK, cuando hubo bump o reset inicial.
8. **Novedades** → si hubo bump o versión inicial, una entrada nueva al tope de `CHANGELOG.md` (y el README enlaza ese historial; «Qué trae» resume solo la versión nueva). Tras el tag en `origin`, `./scripts/dt-publish-github-release.sh` publica esa entrada en GitHub Releases.

## Clasificación (`auto_bump: classify`)

El dígito mide el efecto sobre quien ya usa el proyecto, no la cantidad de archivos ni de líneas. En canónico el proyecto es El DT (comandos, skills, especialistas, contratos de `vitals`, docs públicas). En consumer es el producto de ese repo. `framework_version` no se bumpa en consumer.

Se mira el diff sin exclusiones de `/guardar` y sin los archivos que el propio bump reescribe (`VERSION`, badge del README, campos `version` de `package.json`, `framework_version`).

| Dígito | Cuándo | Después del commit |
|--------|--------|--------------------|
| **major** `X.0.0` | Quien ya lo usa tiene que cambiar de hábito, o se rompe un contrato público (comando, skill, schema de `vitals`, API o formato que otros leen) | Hay que adaptarse |
| **minor** `x.Y.0` | Capacidad nueva (comando, skill, especialista, flujo, integración) y el uso anterior sigue igual | Puede algo nuevo |
| **patch** `x.y.Z` | Corrección, aclaración o mantenimiento de algo que ya existe | Puede lo mismo |

Si el diff mezcla niveles, gana el más alto. Si hay duda entre dos dígitos vecinos, se elige el menor y el motivo queda en el commit. No se pregunta.

Quedan en patch aunque el diff sea grande: formato, comentarios, el mismo cambio espejado entre `.cursor` / `.agents` / `.claude`, y el sync de versión.

Al subir un dígito, los de la derecha vuelven a cero.

## Bump

| Evento | Script |
|--------|--------|
| Resolver (consumer, antes del bump) | `./scripts/project-resolve-version.sh` |
| Patch | `./scripts/project-bump-version.sh patch` |
| Minor | `./scripts/project-bump-version.sh minor` |
| Major | `./scripts/project-bump-version.sh major` |
| Reset consumer (proyecto nuevo) | `resolve` escribe `initial_semver` en `VERSION` |

`auto_bump: classify` en canónico. Un equipo puede fijar `patch`, `minor` o `major`, o dejar `none` con `initialized: true` para no incrementar.

## Sync (`project-sync-version.sh`)

| Tipo | Archivo |
|------|---------|
| `readme_badge` | `README.md` → `**vX.Y.Z**` |
| `yaml_frontmatter` | `dt-upstream.md` → `framework_version` (= VERSION **solo en canónico**; en consumer el sync lo saltea) |
| `json` | front/back/apps `package.json` |

Discover: `frontend/`, `backend/`, `apps/*/package.json`.

## Encoding

Los scripts Ruby no heredan el locale del host. Claude Code, CI y Docker suelen correr con `LANG=C` (US-ASCII); `File.read` de markdown/YAML entonces revienta. `scripts/lib/force_utf8.rb` + `scripts/lib/force_utf8.sh` fuerzan UTF-8 (`RUBYOPT=-EUTF-8:UTF-8`) en `/guardar`, `dt-doctor` y el resto de entrypoints. No hace falta cambiar el locale de la máquina.

## Scripts

- [`scripts/lib/force_utf8.rb`](../../scripts/lib/force_utf8.rb) / [`scripts/lib/force_utf8.sh`](../../scripts/lib/force_utf8.sh)
- [`scripts/project-version.rb`](../../scripts/project-version.rb)
- [`scripts/project-resolve-version.sh`](../../scripts/project-resolve-version.sh)
- [`scripts/project-bump-version.sh`](../../scripts/project-bump-version.sh)
- [`scripts/project-sync-version.sh`](../../scripts/project-sync-version.sh)
- [`scripts/dt-tag-version.sh`](../../scripts/dt-tag-version.sh)
- [`scripts/dt-publish-github-release.sh`](../../scripts/dt-publish-github-release.sh)
- [`scripts/dt-publish-gate.sh`](../../scripts/dt-publish-gate.sh)

## Skills

- [`git-guardar`](../../.cursor/skills/git-guardar/SKILL.md)
- [`dt-oficial`](../../.cursor/skills/dt-oficial/SKILL.md)
- [`dt-bootstrap`](../../.cursor/skills/dt-bootstrap/SKILL.md)
