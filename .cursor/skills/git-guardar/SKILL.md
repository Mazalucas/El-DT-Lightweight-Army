---
name: git-guardar
description: "[Rutina] Commit y push — bump patch, sync README/front/back, commit vX.Y.Z, tag. Use when the user invokes /guardar."
---

# git-guardar

Spec versión: [`vitals/specs/project-version.md`](../../../vitals/specs/project-version.md).

## Invocaciones

| Comando | Bump | Cuándo |
|---------|------|--------|
| `/guardar` | **patch** | Hay cambios a commitear (guardar = entrega con nueva versión) |
| `/guardar release minor` | **minor** | Mismo, bump minor explícito |
| Sin cambios en el repo | — | No bump; informar "sin cambios" |

`/guardar release` = alias de patch (opcional).

## Pre-requisitos

1. `vitals/ops/session.yaml` con `operator.id` — pedir `/yo` salvo pedido explícito de avanzar sin sesión.
2. `vitals/config/dt-upstream.md` → `mode`: **`canonical`** | **`consumer`**.
3. Opcional: `git fetch`; si behind → `/actualizar`.

## Exclusiones (nunca stage)

- `vitals/ops/session.yaml`
- `.env`, `.env.local`, `*.credentials`
- `vitals/workspace.yaml`
- `vitals/work/inbox/**/draft-*`

## Flujo (ambos modos)

1. `git status` — si **no hay cambios** (salvo archivos excluidos) → **detener** sin bump.
2. `git reset HEAD vitals/ops/session.yaml` si quedó staged.
3. **Bump** (ver excepciones abajo):

   ```bash
   ./scripts/project-bump-version.sh patch   # o minor si pidió release minor
   ```

4. **`./scripts/project-sync-version.sh`** — README, `framework_version`, front/back/tools.
5. Stage selectivo + archivos tocados por bump/sync (`VERSION`, README, etc.).
6. `./scripts/dt-doctor.sh` — corregir ERRORES.
7. **Commit** — primera línea **siempre** con la versión **nueva**:

   ```text
   v{X.Y.Z} ({operator_id}): {resumen corto}
   ```

8. `git push origin HEAD` — sin `--force` en main/master.
9. **Tag** tras push OK:

   ```bash
   ./scripts/dt-tag-version.sh --push --message "Release v$(cat VERSION)"
   ```

   Tras bump, el tag debe ser nuevo. Si falla (tag en otro commit sin bump previo) → reportar error.

---

## Excepciones de bump

| Caso | Bump |
|------|------|
| Consumer primer `/guardar` (`initialized: false`) | **No** — reset `VERSION` → `initial_semver` (`0.1.0`), luego sync |
| `/guardar` con cambios | **patch** (default) |
| `/guardar release minor` | **minor** |
| Sin cambios | **No** ejecutar guardar |

---

## Modo `consumer`

- Manifest: `/bootstrap` o primer guardar.
- Tras `initialized: true`, cada `/guardar` con cambios → patch + sync + tag.
- `framework_version` en `dt-upstream.md` **no** se bump aquí (solo en canónico alinea con VERSION).

---

## Modo `canonical` (El DT)

Manifest: [`vitals/config/project-version.yaml`](../../../vitals/config/project-version.yaml) · `auto_bump: patch`.

Cada `/guardar` con cambios: **patch** → sync README + `framework_version` + tools/front/back → commit `vX.Y.Z:` → tag.

`/github-save-small` = mismo flujo documentado para release explícito del template.

---

## Entrega

- Versión anterior → nueva (`1.7.8` → `1.7.9`)
- Archivos sincronizados
- Hash, push, tag `vX.Y.Z`
