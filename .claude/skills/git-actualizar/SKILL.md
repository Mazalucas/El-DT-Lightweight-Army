---
name: git-actualizar
description: "[Rutina] Sincronizar proyecto (origin) y comprobar novedades del framework DT (upstream). No toca session.yaml. Use when the user invokes /actualizar."
---

# git-actualizar

**Dos fases independientes.** No crea, no resetea ni modifica `vitals/ops/session.yaml`.

Instrucciones upstream (Markdown): [`references/upstream-check.md`](references/upstream-check.md) · spec [`vitals/specs/dt-upstream-config.md`](../../../vitals/specs/dt-upstream-config.md).

## Fase A — Proyecto (siempre)

1. Resolver `git_root` (si existe `vitals/workspace.yaml`, respetar multi-proyecto).
2. Ejecutar:

   ```bash
   git fetch origin
   git pull --rebase
   ```

3. Reportar breve: commits traídos o "al día", rama actual, conflictos si los hay.

## Fase B — Framework DT (consulta only)

Seguir **todo** [`references/upstream-check.md`](references/upstream-check.md).

Resumen: leer `vitals/config/dt-upstream.md`, comparar semver con tags de `dt-upstream`, avisar si hay release nueva → ofrecer **`/actualizar-dt`**. **No** checkout. **No** scripts Ruby.

## Post-Fase A (opcional)

Tras pull grande en rules/commands/skills del **proyecto**, sugerir **`/setup`** o [`post-sync-pipeline.md`](../dt-setup/references/post-sync-pipeline.md).

## Sesión

Si **no existe** `vitals/ops/session.yaml` or `operator.id` vacío → una línea: **"Para trabajar con identidad en este repo, usá `/yo`."**

## Conflictos (Fase A)

- Listar archivos en conflicto; no `push --force` en main/master.
- Tras resolver: **`/guardar`** si va a commitear.

## No hacer

- No tocar `vitals/ops/session.yaml`.
- No ejecutar apply de sync desde `/actualizar`.
- No invocar scripts Ruby para Fase B.
