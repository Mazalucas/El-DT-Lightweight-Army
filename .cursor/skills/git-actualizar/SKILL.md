---
name: git-actualizar
description: "[Rutina] Sincronizar con el remoto (git pull --rebase). No toca session.yaml. Use when the user invokes /actualizar."
---

# git-actualizar

**Solo Git.** No crea, no resetea ni modifica `vitals/ops/session.yaml`.

## Pasos

1. Resolver `git_root` (si existe `vitals/workspace.yaml`, respetar multi-proyecto).
2. Ejecutar:

   ```bash
   git fetch origin
   git pull --rebase
   ```

3. Reportar breve: commits traídos o "al día", rama actual, conflictos si los hay.
4. Si **no existe** `vitals/ops/session.yaml` o `operator.id` vacío → una línea: **"Para trabajar con identidad en este repo, usá `/yo`."** (la rule `06-dt-colaboracion` también lo exige en conversación).

## Conflictos

- Listar archivos en conflicto; no `push --force` en main/master.
- Tras resolver: el usuario puede seguir; si va a commitear, **`/guardar`**.

## No hacer

- No tocar `vitals/ops/session.yaml`.
- No sustituir `/yo` ni pedir identidad larga aquí — solo recordatorio si falta sesión.
