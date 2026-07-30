---
name: git-guardar
description: "[Rutina] Commit y push — versión del proyecto (no del DT), commits con vX.Y.Z; bump y tag solo con /guardar release. Use when the user invokes /guardar."
---

# git-guardar

Spec versión: [`vitals/specs/project-version.md`](../../../vitals/specs/project-version.md).

## Invocaciones

| Comando | Bump semver | Tag |
|---------|-------------|-----|
| `/guardar` | No (default) | Solo si cambió `VERSION` en el commit |
| `/guardar release` | **patch** | Sí (si `tag_releases`) |
| `/guardar release minor` | **minor** | Sí |
| `/guardar release patch` | **patch** | Sí |

También aplica si el operador escribe "release", "minor release" o "patch release" en el mismo mensaje.

## Pre-requisitos

1. Leer `vitals/ops/session.yaml`. Si `operator.id` está vacío o ausente → **detener** y pedir `/yo`.
2. Leer `vitals/config/dt-upstream.md` → `mode`: **`canonical`** | **`consumer`**.
3. Opcional: `git fetch`; si behind → sugerir `/actualizar`.

## Exclusiones obligatorias (nunca stage)

- `vitals/ops/session.yaml`
- `.env`, `.env.local`, `*.credentials`
- `vitals/workspace.yaml`
- `vitals/work/inbox/**/draft-*`

## Pasos comunes

1. `git status` — resumen al usuario.
2. Si `session.yaml` staged → `git reset HEAD vitals/ops/session.yaml`.
3. Stage selectivo: código producto, `docs/`, `vitals/` (excepto exclusiones).

Detectar **release explícito** (`/guardar release` …) antes de tocar versión.

---

## Modo `consumer` — versión **del proyecto**

**Regla:** no continuar numeración del DT. `framework_version` en `dt-upstream.md` no se bump aquí.

### Manifest (`vitals/config/project-version.yaml`)

- Lo prepara **`/bootstrap`** (discover + sync). Si falta → fallback en primer `/guardar` (copiar example + discover).
- Default **`auto_bump: none`** — bump solo con release explícito.

### Primer `/guardar` (`initialized: false`)

1. Si no hay manifest → copiar example, discover `package.json`, reset `VERSION` a `initial_semver`, `./scripts/project-sync-version.sh`.
2. Si bootstrap ya preparó manifest → solo confirmar `VERSION` alineada con `sync_paths`.
3. Commit con prefijo `v{X.Y.Z}` — **sin bump**.
4. Tras push OK → `initialized: true`.
5. Tag inicial si `tag_releases` y no existe `v{X.Y.Z}`:

   ```bash
   ./scripts/dt-tag-version.sh --push --message "Release v$(cat VERSION)"
   ```

### `/guardar` habitual (sin "release")

1. **No** bump `VERSION`.
2. `./scripts/project-sync-version.sh` solo si `VERSION` cambió manualmente (raro).
3. `./scripts/dt-doctor.sh` si tocó normativa DT local.
4. Commit:

   ```text
   v{X.Y.Z} ({operator_id}): {resumen corto}

   Operador: {operator_name} ({role})
   Framework DT: {framework_version}
   Archivos: {lista breve}
   ```

5. Push; tag **solo** si `VERSION` cambió en el commit.

### `/guardar release` (patch / minor / patch explícito)

1. Bump `VERSION` raíz (patch por defecto; minor si lo pidió).
2. `./scripts/project-sync-version.sh`.
3. Mismo formato de commit con **nueva** versión en el prefijo.
4. Push + tag:

   ```bash
   ./scripts/dt-tag-version.sh --push --message "Release v$(cat VERSION)"
   ```

**No** bump por cambios solo de normativa DT importada — eso va con `/actualizar-dt`.

---

## Modo `canonical` — repo template El DT

- **No** auto-bump `VERSION` (release → `/github-save-small`).
- `./scripts/dt-doctor.sh` antes de commitear normativa.

```text
dt({operator_id}): {resumen corto}

Operador: {operator_name} ({role})
Versión template: {VERSION}
Archivos: {lista breve}
```

---

## Entrega

- Hash o "sin cambios"
- Modo y versión actual (`VERSION`)
- ¿Release? (sí/no) y bump aplicado
- Push ok/error
- Tag `vX.Y.Z` o motivo de omisión
