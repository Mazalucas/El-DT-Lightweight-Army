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
   - `VERSION` → reiniciar a `0.1.0` del nuevo proyecto (preguntar). **La versión del framework queda en `framework_version` de `vitals/config/dt-upstream.md`**, no en `VERSION` raíz.
   - `vitals/config/roster.yaml` → `team: []`.
   - `vitals/pulse/` → limpiar entries de ejemplo (conservar `current.md` como puntero vacío).
   - Banner/README → placeholder del nuevo proyecto (preguntar antes de reescribir).

6. **Garantizar estructura**: correr el skill `dt-setup` (`/setup`) para el/los IDE(s) elegido(s).
7. **Verificar**: `./scripts/dt-doctor.sh` en verde.
8. **Resumen**: qué quedó conectado (remoto nuevo + `dt-upstream`), qué se soltó, y que `/actualizar` avisará cuando haya releases nuevos del DT.

## Gate duro (no saltear)

- `git remote remove`, mover carpetas, `git init`, reset de estado → **irreversibles**: requieren confirmación explícita y working tree limpio.
- Nunca borrar historial sin que el usuario lo pida.
- Nunca commitear secretos durante el proceso.
