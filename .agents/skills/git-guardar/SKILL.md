---
name: git-guardar
description: "[Rutina] Commit y push — commits con vX.Y.Z, sync README/front/back, tag release. Use when the user invokes /guardar."
---

# git-guardar

Spec versión: [`vitals/specs/project-version.md`](../../../vitals/specs/project-version.md).

## Invocaciones

| Comando | Bump semver | Sync + tag |
|---------|-------------|------------|
| `/guardar` | No (default) | Sync paths; commit `vX.Y.Z:`; tag si falta en HEAD |
| `/guardar release` | **patch** | Sync; bump; commit; tag `vX.Y.Z` |
| `/guardar release minor` | **minor** | Igual |
| `/guardar release patch` | **patch** | Igual |

También aplica si el operador escribe "release", "minor release" o "patch release".

## Pre-requisitos

1. Leer `vitals/ops/session.yaml`. Si `operator.id` vacío → pedir `/yo` (salvo pedido explícito de avanzar sin sesión).
2. Leer `vitals/config/dt-upstream.md` → `mode`: **`canonical`** | **`consumer`**.
3. Opcional: `git fetch`; si behind → sugerir `/actualizar`.

## Exclusiones obligatorias (nunca stage)

- `vitals/ops/session.yaml`
- `.env`, `.env.local`, `*.credentials`
- `vitals/workspace.yaml`
- `vitals/work/inbox/**/draft-*`

## Pasos comunes (ambos modos)

1. `git status` — resumen al usuario.
2. Si `session.yaml` staged → `git reset HEAD vitals/ops/session.yaml`.
3. Detectar **release explícito** antes de bump.
4. **`./scripts/project-sync-version.sh`** — propaga `VERSION` raíz a:
   - `README.md` (badge `**vX.Y.Z**`)
   - `vitals/config/dt-upstream.md` (`framework_version` en canónico)
   - `package.json` / `frontend/` / `backend/` / `apps/*` (discover + manifest)
5. Stage cambios (incluir archivos tocados por sync si difieren).
6. `./scripts/dt-doctor.sh` — corregir ERRORES antes de commit.
7. **Commit:** la primera línea **siempre** empieza con el número de versión:

   ```text
   v{X.Y.Z} ({operator_id}): {resumen corto}
   ```

   Sin sesión: `v{X.Y.Z}: {resumen}`.

8. Push `git push origin HEAD` — sin `--force` en main/master.
9. **Tag obligatorio** tras push OK:

   ```bash
   ./scripts/dt-tag-version.sh --push --message "Release v$(cat VERSION)"
   ```

   - Crea tag anotado **`vX.Y.Z`** en `HEAD` si no existe.
   - Si el tag existe en otro commit → **detener** (bump con `/guardar release`).

---

## Modo `consumer` — versión del **producto**

**Regla:** no heredar semver del DT clonado. `framework_version` ≠ `VERSION` raíz.

### Manifest

- Lo prepara **`/bootstrap`**. Fallback en primer `/guardar` si falta.
- `auto_bump: none` — bump solo con release explícito.

### Primer `/guardar` (`initialized: false`)

1. Crear manifest si falta; discover `package.json`; reset `VERSION` → `initial_semver` (`0.1.0`).
2. `./scripts/project-sync-version.sh`.
3. Commit `v{initial_semver}: …`; push; tag inicial; `initialized: true`.

### Bump

Solo con **`/guardar release`** (patch/minor). Luego sync → commit → tag.

---

## Modo `canonical` — repo **El DT**

Manifest versionado: [`vitals/config/project-version.yaml`](../../../vitals/config/project-version.yaml).

Cada `/guardar`:

1. **Sync obligatorio** — README, `framework_version`, tools/front/back según manifest + discover.
2. Commit **siempre** con prefijo `v{X.Y.Z}:` (semver de `VERSION` raíz = versión publicada del DT).
3. **Tag obligatorio** en HEAD (`dt-tag-version.sh --push`).
4. Bump **solo** con `/guardar release` (equivalente operativo a `/github-save-small` para semver).

`/github-save-small` sigue disponible como alias documentado de release del template.

---

## Entrega

- Hash o "sin cambios"
- Modo, `VERSION` y archivos sincronizados (README, front/back, etc.)
- ¿Release? (bump sí/no)
- Push ok/error
- Tag `vX.Y.Z` pusheado o error
