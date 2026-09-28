---
name: dt-bootstrap
description: "[Framework] Usar El DT como base de un proyecto: promover al raíz, soltar el remoto del template, resetear estado y correr /setup. Operación irreversible con dry-run y confirmación. Use when the user invokes /bootstrap o /usar-como-base."
---

# dt-bootstrap

Convierte el template El DT en la **base de tu propio proyecto**: lo promueve a la raíz, suelta el remoto del template y deja el repo listo para tu trabajo. Es una operación **irreversible** → cae bajo el **gate duro** (`vitals/specs/precedence.md`): siempre dry-run + confirmación explícita + working tree limpio.

## Pre-requisitos

1. Sesión válida (`/yo`).
2. Working tree limpio (`git status`). Si hay cambios sin commitear → detener y pedir `/guardar` o stash.
3. Confirmar destino: ¿el DT está en una subcarpeta del proyecto o ya es la raíz?

## Pasos (con dry-run primero)

1. **Dry-run**: listar exactamente qué se va a mover, qué remoto se va a soltar, registro de `dt-upstream`, y qué se va a resetear. Mostrarlo y pedir confirmación. **No** ejecutar nada hasta el OK.
2. **Promover al raíz** (si está en subcarpeta): mover el contenido del DT a la raíz del proyecto destino sin pisar archivos existentes; ante colisión, preguntar.
3. **Registrar upstream del template** (antes de soltar `origin`):

   ```bash
   TEMPLATE_URL="$(git remote get-url origin)"
   git remote add dt-upstream "$TEMPLATE_URL"   # idempotente si ya existe
   ```

   Capturar `FRAMEWORK_VERSION="$(cat VERSION)"` (semver DT actual).

   Crear o actualizar `vitals/config/dt-upstream.md` (desde `vitals/config/dt-upstream.example.md`):

   ```markdown
   ---
   version: 1
   mode: consumer
   framework_version: "<FRAMEWORK_VERSION>"
   source:
     remote: dt-upstream
     ref: main
   ---
   ```

   Spec: [`vitals/specs/dt-upstream-config.md`](../../../vitals/specs/dt-upstream-config.md).

4. **Soltar el remoto del template** (irreversible):

   ```bash
   git remote remove origin
   ```

   Ofrecer: `git remote add origin <tu-repo>` y/o `git init` fresco si el usuario quiere historial limpio (sin el del template).

5. **Resetear estado del template**:
   - Capturá `FRAMEWORK_VERSION` **antes** de tocar `VERSION`. Queda en `framework_version` de `dt-upstream.md`, no en `VERSION` raíz.
   - Si el destino **ya tiene** semver de producto (`package.json` en raíz/`frontend`/`backend`/`apps/*`) → `VERSION` = esa versión. **No** copies la del DT. **No** preguntes si conviene “usar la del framework”.
   - Si el proyecto es **nuevo** (sin semver de producto) → `VERSION` → `0.1.0` (preguntar solo el número inicial, default `0.1.0`).
   - **`vitals/config/project-version.yaml`** — crear desde [`project-version.yaml.example`](../../../vitals/config/project-version.yaml.example):
     - `initialized: false`, `auto_bump: none`, `initial_semver` = el `VERSION` que acabás de fijar
     - **Discover** `package.json` en raíz, `frontend/`, `backend/`, `apps/*/package.json` → `sync_paths` (producto). **No** agregues `framework_version` a `sync_paths`.
     - `./scripts/project-resolve-version.sh` y `./scripts/project-sync-version.sh` — unificar semver del producto; el DT no se copia
     - Spec: [`vitals/specs/project-version.md`](../../../vitals/specs/project-version.md)
   - `vitals/config/roster.yaml` → `team: []`.
   - Borrar `vitals/config/collaboration.yaml` si existe (conservar el `.example`). No preguntar postura: el proyecto nuevo la responde en el primer `/yo`, con el roster ya vacío.
   - `vitals/pulse/` → limpiar entries de ejemplo (conservar `current.md` como puntero vacío).
   - Banner/README → placeholder del nuevo proyecto (preguntar antes de reescribir).

6. **Garantizar estructura**: correr el skill `dt-setup` (`/setup`) para el/los IDE(s) elegido(s).
7. **Verificar**: `./scripts/dt-doctor.sh` en verde.
8. **Resumen**: remoto nuevo + `dt-upstream`, `VERSION` del **producto** (existente o `0.1.0`) + `project-version.yaml`, primer **`/guardar`** (resolve + bump o tag inicial; si `auto_bump` era `none`, pasa a `classify`). Este checkout ya no publica al DT: `/guardar` empuja solo al `origin` propio. El framework entra por `/actualizar-dt`. La versión del DT queda en `framework_version`, nunca en la app.

## Gate duro (no saltear)

- `git remote remove`, mover carpetas, `git init`, reset de estado → **irreversibles**: requieren confirmación explícita y working tree limpio.
- Nunca borrar historial sin que el usuario lo pida.
- Nunca commitear secretos durante el proceso.
- Si `/guardar` se niega porque `origin` sigue siendo el DT, hacé stash, seguí con bootstrap y después `git stash pop`. No insistas con el push ni pidas acceso.
- No entrevistes `personal` / `team`. Eso lo resuelve `/yo`.
