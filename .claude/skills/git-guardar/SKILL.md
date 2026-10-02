---
name: git-guardar
description: "[Rutina] Commit y push — la IA elige patch, minor o major, sync README/front/back, commit vX.Y.Z, tag. Use when the user invokes /guardar."
---

# git-guardar

Spec versión: [`vitals/specs/project-version.md`](../../../vitals/specs/project-version.md).

## Invariante — dos semver distintos

`VERSION` (raíz) es **solo** la versión del producto de este repo. `framework_version` en `vitals/config/dt-upstream.md` es **solo** la del DT.

- **Nunca** copies, sugieras ni escribas el semver del DT en `VERSION`, `package.json` ni el badge del producto.
- **Nunca** uses `framework_version` como si fuera la app.
- Si el producto ya tiene semver (`package.json` en raíz/`frontend`/`backend`/`apps/*`, o `VERSION` distinta del DT) → **conservala** y hacé bump con los criterios de abajo.
- Si el proyecto es nuevo (no hay semver de producto) → partí de `initial_semver` (`0.1.0`). No heredes el número del DT.

El script lo garantiza. Antes de bumpear:

```bash
./scripts/project-resolve-version.sh
```

Leé `DT_PRODUCT_VERSION`, `DT_FRAMEWORK_VERSION` y `DT_VERSION_ACTION`. Si bump/sync fallan porque `VERSION` coincide con el DT, resolvé; no pises el `package.json` a mano.

## Invocaciones

| Comando | Bump | Cuándo |
|---------|------|--------|
| `/guardar` | **lo elige la IA** | Hay cambios a commitear |
| `/guardar release patch\|minor\|major` | el dígito nombrado | El mensaje ya lo especifica; no reclasificar |
| Sin cambios en el repo | — | No bump; informar "sin cambios" |

`/guardar release` a secas = **patch**. También vale nombrarlo en prosa (“bumpeá major”, “esto es un patch”).

## Pre-requisitos

1. `vitals/ops/session.yaml` con `operator.id` — pedir `/yo` salvo pedido explícito de avanzar sin sesión.
2. `vitals/config/dt-upstream.md` → `mode`: **`canonical`** | **`consumer`**.
3. Opcional: `git fetch`; si behind → `/actualizar`.

## Exclusiones (nunca stage)

- `vitals/ops/session.yaml`
- `vitals/ops/canonical-checkout.yaml`
- `vitals/ops/collaboration.local.yaml`
- `vitals/ops/context-profile.yaml`
- `.cursor/rules/99-perfil-local.mdc`
- `.claude/rules/99-perfil-local.md`
- `.agents/rules/99-perfil-local.md`
- `.env`, `.env.local`, `*.credentials`
- `vitals/workspace.yaml`
- `vitals/config/drive-context.yaml`
- `vitals/config/gmail-context.yaml`
- `vitals/config/calendar-context.yaml`
- `vitals/config/google-apps.yaml`
- `vitals/work/inbox/**/draft-*`

## Gate de publicación (antes del bump)

Corré `./scripts/dt-publish-gate.sh`. El exit es una decisión. Leé la línea `DT_PUBLISH_GATE`. Spec: [`vitals/specs/canonical-publish.md`](../../../vitals/specs/canonical-publish.md).

| Exit | Qué hacer |
|------|-----------|
| **0** | Este checkout está activado con `/oficial` y el árbol no lleva rastros personales. Seguí el flujo completo, incluido push y tag al DT. El commit **no** lleva `operator_id`. |
| **10** | `origin` es otro repo. Seguí el flujo y pusheá a ese `origin`. No hables del remoto oficial ni de pedir acceso. El commit sí puede llevar `operator_id`. |
| **20** | No hay `origin`. Podés commitear en local. Sin `git push` y sin `dt-tag-version.sh --push`. No agregues el remoto oficial. Siguiente paso: un repo propio o `/bootstrap`. |
| **30** o **40** | **Pará.** Sin bump, sin commit, sin push, sin tag. Copiá el mensaje del script. No ofrezcas acceso, invitación ni `gh auth` para publicar el DT. Si el 40 dice **keyring o sandbox** y el operador acaba de mostrar `gh api user` = publisher en su terminal, reintentá el gate **una vez** sin sandbox (el agente necesita el llavero). No es un rechazo de identidad. |
| **50** | El checkout es oficial, pero hay sesión, roster con personas, inbox, postura o notas locales en el árbol. **Pará.** No las stagees ni las borres. El `roster.yaml` versionado sigue en `team: []`. Cuando eso no esté en el commit, volvé a correr el gate. |
| otro | Pará y mostrá la salida. |

`mode: canonical` no saltea este paso.

## Flujo (ambos modos)

1. `git status` — si **no hay cambios** (salvo archivos excluidos) → **detener** sin bump.
2. **Gate** — `./scripts/dt-publish-gate.sh`. Aplicá la tabla de arriba antes de tocar `VERSION`.
3. `git reset HEAD vitals/ops/session.yaml vitals/ops/canonical-checkout.yaml vitals/ops/collaboration.local.yaml vitals/ops/context-profile.yaml .cursor/rules/99-perfil-local.mdc .claude/rules/99-perfil-local.md .agents/rules/99-perfil-local.md` si quedaron staged. En gate **0**, tampoco stagees `roster.yaml` si `team` no está vacío, ni `vitals/work/inbox/`, ni `vitals/config/collaboration.yaml`.
4. **Resolver VERSION del producto** (consumer: nunca la del DT):

   ```bash
   ./scripts/project-resolve-version.sh
   ```

   - `DT_VERSION_ACTION=keep` → hay semver de producto; seguí al dígito y bump.
   - `DT_VERSION_ACTION=initial` → proyecto nuevo; `VERSION` ya es `0.1.0` (o `initial_semver`). **No** incrementes. Marcá `initialized: true` y, si `auto_bump` era `none`, pasalo a `classify`. Sync, commit y tag de esa versión inicial.
   - `DT_VERSION_ACTION=unchanged` → `VERSION` ya era la del producto; seguí al dígito y bump (salvo `auto_bump: none`).
5. **Elegir el dígito** (ver abajo) y bumpear, salvo acción `initial` o `auto_bump: none`:

   ```bash
   ./scripts/project-bump-version.sh patch   # o minor, o major
   ```

6. **`./scripts/project-sync-version.sh`** — README y `package.json` del **producto**. En consumer **no** toques `framework_version` (el script lo saltea). En canónico sí alinea `framework_version` con `VERSION`.
7. **Novedades** — si hubo bump o versión inicial, agregá al tope de `CHANGELOG.md` la entrada `## [X.Y.Z] - fecha` con lo que quien ya usa el proyecto puede hacer ahora. En el README, «Qué trae» queda solo con esa versión y el enlace al historial. Las notas salen del diff. No inventes releases que no se taguearon. Si no hubo bump, no toques el changelog.
8. Stage selectivo + archivos tocados por resolve/bump/sync (`VERSION`, README, `CHANGELOG.md`, etc.).
9. `./scripts/dt-doctor.sh` — corregir ERRORES.
10. **Commit** — primera línea **siempre** con la versión **nueva**.

   Gate **0** (remoto oficial). Sin nombre de operador: quien clona el framework no tiene que ver la sesión.

   ```text
   v{X.Y.Z}: {resumen corto}

   Bump: {patch|minor|major} — {motivo en una línea}
   ```

   Gate **10** o **20** (repo propio):

   ```text
   v{X.Y.Z} ({operator_id}): {resumen corto}

   Bump: {patch|minor|major} — {motivo en una línea}
   ```

11. `git push origin HEAD` — solo si el gate salió **0** o **10**. Sin `--force` en main/master. Si el remoto rechaza por permisos, pará: ese remoto no es de este checkout. No pidas acceso ni reintentes contra el DT oficial.
12. **Tag** tras push OK, cuando hubo bump o reset inicial. En gate **20**, no corras el tag con `--push`:

   ```bash
   ./scripts/dt-tag-version.sh --push --message "Release v$(cat VERSION)"
   ```

   Tras bump, el tag debe ser nuevo. Si falla (tag en otro commit sin bump previo) → reportar error.
13. **GitHub Release** — tras el tag en `origin`, publicá la entrada nueva:

   ```bash
   ./scripts/dt-publish-github-release.sh
   ```

   Si `gh` no está autenticado, el tag ya está: reportá el fallo. No publiques contra otro remoto.

---

## Dígito

Precedencia:

1. El mensaje nombra **patch**, **minor** o **major** → ese. No reclasificar.
2. Si no, leé `auto_bump` en [`vitals/config/project-version.yaml`](../../../vitals/config/project-version.yaml):
   - `patch` | `minor` | `major` → ese dígito fijo.
   - `none` con `initialized: true` → commit y push **sin** bump ni tag nuevo.
   - `classify` → clasificá el diff.

Clasificación, sobre el diff sin exclusiones y sin lo que el bump reescribe (`VERSION`, badge del README, `version` en `package.json`, `framework_version`):

1. **major** — quien ya usa el proyecto tiene que cambiar de hábito, o se rompe un contrato público: comando, skill, schema de `vitals`, API o formato que otros leen.
2. **minor** — capacidad nueva (comando, skill, especialista, flujo, integración) y el uso anterior sigue igual.
3. **patch** — corrección, aclaración o mantenimiento de algo que ya existe.

En canónico el proyecto es El DT. En consumer, el producto de ese repo.

Si el diff mezcla niveles, gana el más alto. Si dudás entre dos vecinos, elegí el menor y dejá el motivo en `Bump:`. No preguntes.

Quedan en patch aunque el diff sea grande: formato, comentarios, el mismo cambio espejado en `.cursor` / `.agents` / `.claude`, y el sync de versión.

---

## Excepciones de bump

| Caso | Bump |
|------|------|
| Consumer con semver de producto (`DT_VERSION_ACTION=keep`) | El dígito de la clasificación (o el nombrado). Base = versión de la app, **nunca** la del DT |
| Consumer proyecto nuevo (`DT_VERSION_ACTION=initial`) | **No** incrementar — `VERSION` ya es `initial_semver`; `initialized: true`; si `auto_bump` era `none` pasarlo a `classify`. Luego sync, commit y tag |
| `initialized: false` pero la app ya tiene semver | Igual que `keep`: no escribas `initial_semver`, no copies el DT, bump desde la app |
| `auto_bump: classify` | El dígito de la clasificación |
| `auto_bump: patch\|minor\|major` | Ese dígito, salvo override del mensaje |
| `auto_bump: none` y `initialized: true` | Sin bump ni tag nuevo |
| Sin cambios | **No** ejecutar guardar |

---

## Modo `consumer`

- Manifest: `/bootstrap` o primer guardar. No copies `project-version.yaml` canónico ni el `VERSION` del DT.
- **`./scripts/project-resolve-version.sh` es obligatorio** antes del bump. Si la app ya tenía `0.4.2` y `VERSION` decía `1.8.0` (DT), se queda en `0.4.2` y recién ahí se bump.
- Tras `initialized: true` y `auto_bump: classify`, cada `/guardar` con cambios clasifica, sync y tag **del producto**.
- `framework_version` en `dt-upstream.md` **no** se bump ni se sincroniza desde `VERSION`.

---

## Modo `canonical` (El DT)

Manifest: [`vitals/config/project-version.yaml`](../../../vitals/config/project-version.yaml) · `auto_bump: classify`.

Cada `/guardar` con cambios, y solo si el gate salió **0**: **el dígito elegido** → sync README + `framework_version` + tools/front/back → entrada en `CHANGELOG.md` → commit `vX.Y.Z:` → tag → GitHub Release.

`/github-save-small` = mismo flujo.

---

## Entrega

- Versión anterior → nueva, con el motivo (`1.7.11` → `1.8.0`, minor — comando nuevo)
- Archivos sincronizados
- Entrada en `CHANGELOG.md` (si hubo bump o versión inicial)
- Hash, push, tag `vX.Y.Z` y GitHub Release (si hubo bump o reset inicial)
