# Multi-proyecto y contexto Git

## Objetivo

Cuando el workspace tiene **uno o varios** repositorios Git (multi-root, monorepo con varios remotes, carpetas hermanas), el DT debe **saber en qué proyecto actúa** antes de comandos que afectan historial, remotos o rutas.

## Detección

- Un solo `.git` en la raíz del workspace → contexto único (salvo submódulos; entonces tratar como multi-contexto si el usuario trabaja en submódulo).
- Varios roots en el workspace de IDE → **multi-proyecto** hasta demostrar lo contrario.

## Manifest opcional

`vitals/workspace.yaml` (copiar desde [workspace.yaml.example](../workspace.yaml.example)):

- `projects[]` con `id`, `path`, `git_root`, `label`, `aliases[]`
- `default_project` opcional

## Comportamiento ante pedidos ambiguos

Si el usuario dice “commiteá”, “push”, “abrí PR”, “estado de git” **sin** nombrar proyecto:

1. Intentar inferir desde: archivo activo / cwd del terminal / prefijo en el mensaje / `default_project`.
2. Si sigue ambiguo → **preguntar** listando `id` y `path` conocidos.
3. **Nunca** ejecutar git destructivo asumiendo el repo equivocado.

## Huella

Toda entrada en `pulse/entries/` y toda contribución documental que use `agent_contributors` debe incluir `project_id` o `git_root` cuando el workspace sea multi-repo.

## IDE

- Cursor: regla [../../.cursor/rules/05-multi-project-git.mdc](../../.cursor/rules/05-multi-project-git.mdc)
- Antigravity: [../../.agent/rules/05-multi-project-git.md](../../.agent/rules/05-multi-project-git.md)
