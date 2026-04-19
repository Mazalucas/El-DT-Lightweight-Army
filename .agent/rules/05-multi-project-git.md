---
description: Resolver a qué proyecto o git_root aplica un pedido en workspaces multi-repo
---

# Multi-proyecto y contexto Git

Antes de **cualquier** operación Git (commit, push, branch, PR, diff masivo) o de asumir rutas de proyecto:

## Un repo vs varios

- Si el workspace puede tener **más de un** `git_root` (multi-root IDE, varios clones, monorepo con trabajo en subcarpetas con su propio `.git`), tratá el contexto como **multi-proyecto**.

## Resolución

1. Si existe **`vitals/workspace.yaml`** (copia desde `vitals/workspace.yaml.example`), usalo para `project_id`, aliases y `default_project`.
2. Si el usuario **no** nombra el proyecto y el contexto es ambiguo: **preguntá** listando proyectos conocidos (path / id). **No** asumas en silencio.
3. Si podés inferir sin duda razonable (archivo activo en ese root, cwd del terminal, mensaje explícito, `default_project`), indicá en una línea qué proyecto estás usando.

## Huella

Registrá `project_id` o `git_root` en entradas `vitals/pulse/entries/` cuando el cambio sea por proyecto.

Especificación: `vitals/specs/multi-project.md`.
