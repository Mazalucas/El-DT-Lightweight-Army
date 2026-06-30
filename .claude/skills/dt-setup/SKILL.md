---
name: dt-setup
description: "[Rutina/Framework] Primera vez o repair multi-IDE. /bienvenida = checklist markdown sin Ruby; /setup = reparar drift con scripts. Use when the user invokes /bienvenida or /setup."
---

# dt-setup

Setup **multi-IDE**, **no destructivo**. Dos modos; el agente elige según el command invocado y el contexto.

| Command | Modo default |
|---------|----------------|
| `/bienvenida` | **first-run** — checklist markdown, sin Ruby obligatorio |
| `/setup` | **repair** — regenerar desde fuentes canónicas + `dt-doctor` |

Referencias: [`references/first-run-checklist.md`](references/first-run-checklist.md) · [`references/post-sync-pipeline.md`](references/post-sync-pipeline.md)

## Fuente de verdad

Registro de IDEs: `vitals/config/ide-targets.yaml`. No hardcodear IDEs en este skill.

## Modo A — first-run (default en `/bienvenida`)

El clone **ya trae** `.cursor/`, `.agent/`, `.claude/`, commands y skills en Git. El usuario **no necesita Ruby** para empezar.

1. Resolver `git_root` (multi-proyecto: `vitals/workspace.yaml` si existe).
2. Seguir **todo** [`references/first-run-checklist.md`](references/first-run-checklist.md): verificar paths, Git, detectar drift, **registrar dt-upstream si aplica** (§4).
3. **No correr** `sync-ide` ni `dt-doctor` salvo drift evidente **y** que el usuario pida reparar → pasar a modo B.
4. Entregar formato non-dev del checklist (§7).
5. Cierre obligatorio: **"Siguiente paso: `/yo`"** + tarjeta del ritual.

### Registro dt-upstream (first-run)

Si el repo parece El DT (`AGENTS.md` + `vitals/config/commands-meta.yaml`) **y** existe `origin` **y** no existe remote `dt-upstream`:

1. Preguntar: ¿mantenés el repo **canónico/plantilla** o es **consumidor**?
2. **Consumidor (default en clone antes de `/bootstrap`):**

   ```bash
   git remote add dt-upstream "$(git remote get-url origin)"
   ```

   Copiar `vitals/config/dt-upstream.example.md` → `vitals/config/dt-upstream.md` con `mode: consumer` y `framework_version` = contenido de `VERSION`.

3. **Canónico:** `mode: canonical` en el frontmatter (Fase B de `/actualizar` se omite).

No commitear durante `/bienvenida` salvo que el usuario pida `/guardar`.

## Modo B — repair (default en `/setup`, drift, post-pull grande)

1. Mismos checks del modo A.
2. Si Ruby disponible → pipeline completo en [`references/post-sync-pipeline.md`](references/post-sync-pipeline.md).
3. Si Ruby **no** disponible → explicar que la estructura del clone suele bastar; sugerir Ruby solo a maintainers.
4. Informar: targets `enabled` garantizados, resultado de `dt-doctor`, versión `VERSION`.

## Inferencia de modo

- `/bienvenida` → siempre first-run primero; repair solo si checklist falla o usuario pide explícitamente reparar.
- `/setup` → repair; si todo OK en checklist, reportar "estructura OK" y opcionalmente correr pipeline si Ruby hay.
- Drift tras `/actualizar` → repair (compartir pipeline con `git-actualizar` vía `post-sync-pipeline.md`).

## No hacer

- No borrar carpetas de IDE ni usar `--solo` (eliminado).
- No tocar `vitals/ops/session.yaml`, `.env`, credenciales.
- No instalar Git/Ruby/npm sin confirmación explícita del usuario.
- No commitear durante setup.
