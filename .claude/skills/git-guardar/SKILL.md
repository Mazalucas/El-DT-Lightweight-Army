---
name: git-guardar
description: "[Rutina] Commit y push del trabajo del operador — excluye session.yaml y secretos. Use when the user invokes /guardar."
---

# git-guardar

## Pre-requisitos

1. Leer `vitals/ops/session.yaml`. Si `operator.id` está vacío o ausente → **detener** y pedir `/yo`.
2. Opcional: `git fetch` y comprobar si la rama está behind; si sí, sugerir `/actualizar` antes de commit.

## Exclusiones obligatorias (nunca stage)

- `vitals/ops/session.yaml`
- `.env`, `.env.local`, `*.credentials`
- `vitals/workspace.yaml`
- `vitals/work/inbox/**/draft-*`

## Pasos

1. `git status` — mostrar resumen al usuario.
2. Si `vitals/ops/session.yaml` aparece staged:
   ```bash
   git reset HEAD vitals/ops/session.yaml
   ```
3. Stage selectivo (preferir lo tocado en la sesión):
   - `vitals/` (excepto paths excluidos)
   - `docs/`, `.cursor/`, `.agent/`, `README.md`, `AGENTS.md`, `VERSION` si aplican
4. **Versión:** si cambiaron `VERSION`, rules (cualquier stem de `vitals/config/rules-manifest.yaml`), `vitals/specs/`, `vitals/config/` (incl. `rules-manifest.yaml`, `ide-targets.yaml`, `commands-meta.yaml`) o commands/skills de rutina → bump **patch** en `VERSION` (semver del template).
5. **Telemetría (orden continuo):** si bumpeaste `VERSION` o cambió normativa del DT → actualizá `vitals/pulse/current.md` para que mencione el `VERSION` nuevo y un resumen de una línea (y, si corresponde, un entry en `vitals/pulse/entries/`). Esto mantiene `dt-doctor` en verde (chequeo de frescura de pulse).
6. **Orden antes de commitear:** corré `./scripts/dt-doctor.sh`; si hay ERRORES, regenerá artefactos (`ruby scripts/sync-catalog.rb`, `./scripts/sync-ide.sh`, `./scripts/sync-commands-from-meta.sh`) hasta dejarlo en verde.
7. Mensaje de commit (español, una línea + cuerpo breve):

   ```text
   dt({operator_id}): {resumen corto}

   Operador: {operator_name} ({role})
   Archivos: {lista breve}
   Versión template: {VERSION}
   ```

8. Commit solo si hay cambios staged.
9. `git push origin HEAD` — si falla (non-fast-forward), indicar `/actualizar`, resolver, reintentar. **No** `push --force` en main/master.

## Entrega

- Hash de commit o "sin cambios"
- Estado del push (ok / error + siguiente paso)
