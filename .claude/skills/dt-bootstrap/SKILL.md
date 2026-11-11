---
name: dt-bootstrap
description: "[Framework] Usar El DT como base de un proyecto: promover al raíz, soltar el remoto del template, resetear estado y correr /setup. Operación irreversible con dry-run y confirmación. Use when the user invokes /bootstrap o /usar-como-base."
---

# dt-bootstrap

Convierte el template El DT en la **base de tu propio proyecto**: lo promueve a la raíz, suelta el remoto del template y deja el repo listo para tu trabajo. Es una operación **irreversible** → cae bajo el **gate duro** (`vitals/specs/precedence.md`): siempre dry-run + confirmación explícita + working tree limpio.

## Pre-requisitos

1. Sesión válida (`/yo`).
2. Working tree limpio (`git status`). Si hay cambios sin commitear → detener y pedir `/guardar` o stash.
   - **Excepción del recorrido `/bienvenida`:** si los únicos cambios son `vitals/config/dt-upstream.md`, `roster.yaml`, `collaboration.yaml` y carpetas de inbox, hacé `git stash -u`, verificá el árbol limpio y `git stash pop` **justo después de soltar `origin` y antes de `git init`** (el stash vive en `.git`).
3. **Destino, sin preguntar:** si la raíz de Git (`git rev-parse --show-toplevel`) tiene `AGENTS.md` y `vitals/`, el DT ya es la raíz y no se mueve nada. Si el DT está en una subcarpeta de otro proyecto, el destino es la raíz de ese proyecto. Preguntá solo ante colisión de archivos.

## Conversación (una pregunta por mensaje)

Formato del guion [`welcome-message.md`](../dt-setup/references/welcome-message.md) § Camino Construir. Cada mensaje es «**Paso 2 de 3 ·** …», con su **Por qué sirve:**, opciones numeradas (máx. 3) y máximo 12 líneas con texto. Sin jerga.

1. **Nombre** del proyecto → README y versión inicial.
2. **Dónde se guarda:** «1. Todavía en ningún lado · 2. Ya tengo un repo (URL)».
3. **Historial:** «1. Empezar limpio ← recomendado · 2. Conservar el del DT».
4. **Resumen y OK:** máximo **6 puntos** con qué se suelta, qué se borra, qué se resetea y qué se reescribe; «⚠️ No se deshace. ¿Avanzo? 1. Sí · 2. Cambiar algo». El detalle técnico completo (comandos, paths) solo si lo pide.

La versión inicial no se pregunta: `0.1.0`, o el semver de producto que ya exista (paso 5).

## Pasos (con dry-run primero)

1. **Dry-run**: calculá la lista exacta de qué se mueve, qué remoto se suelta, el registro de `dt-upstream` y qué se resetea. Mostrala como el resumen de la pregunta 4 (máx. 6 puntos) y pedí confirmación. **No** ejecutar nada hasta el OK.
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

   Según las respuestas: `git remote add origin <tu-repo>` y/o historial limpio (sin el del template):

   ```bash
   mv .git "/tmp/<proyecto>-dt-git-backup"     # respaldo, no rm -rf
   git init -b main
   git remote add dt-upstream "$TEMPLATE_URL"
   # submódulos de .gitmodules: volver a registrarlos con el mismo commit del índice anterior
   git --git-dir="/tmp/<proyecto>-dt-git-backup" ls-files -s <path>   # → 160000 <sha> 0 <path>
   git update-index --add --cacheinfo 160000,<sha>,<path>
   ./scripts/dt-oficial.sh install-hook
   ```

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
   - **Conservar** `vitals/config/collaboration.yaml` si existe: el template nunca la publica (`private_exact` en `canonical-publish.yaml`), así que solo puede venir del `/yo` de este recorrido. No preguntar postura. Si no existe, la pregunta el `/yo` del paso 3.
   - `vitals/pulse/entries/` → borrar las entries heredadas; **conservar `_plantilla.md` y `.gitkeep`**. `vitals/pulse/current.md` → puntero vacío.
   - Banner/README → placeholder del nuevo proyecto (preguntar antes de reescribir).

6. **Garantizar estructura**: correr el skill `dt-setup` (`/setup`) para el/los IDE(s) elegido(s).
7. **Verificar**: `./scripts/dt-doctor.sh` en verde.
8. **Resumen**: remoto nuevo + `dt-upstream`, `VERSION` del **producto** (existente o `0.1.0`) + `project-version.yaml`, primer **`/guardar`** (resolve + bump o tag inicial; si `auto_bump` era `none`, pasa a `classify`). Este checkout ya no publica al DT: `/guardar` empuja solo al `origin` propio. El framework entra por `/actualizar-dt`. La versión del DT queda en `framework_version`, nunca en la app. Cerrá con el mensaje **Cierre de `/bootstrap` → Paso 3** del guion (`welcome-message.md`): ✅ proyecto creado + versión, «**Paso 3 de 3:** entrar a tu proyecto», **Qué hacemos** / **Por qué sirve** y 👉 `/yo`.

## Gate duro (no saltear)

- `git remote remove`, mover carpetas, `git init`, reset de estado → **irreversibles**: requieren confirmación explícita y working tree limpio.
- Nunca borrar historial sin que el usuario lo pida.
- Nunca commitear secretos durante el proceso.
- Si `/guardar` se niega porque `origin` sigue siendo el DT, hacé stash, seguí con bootstrap y después `git stash pop`. No insistas con el push ni pidas acceso.
- No entrevistes `personal` / `team`. Eso lo resuelve `/yo`.
