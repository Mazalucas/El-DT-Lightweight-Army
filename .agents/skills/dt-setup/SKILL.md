---
name: dt-setup
description: "[Rutina/Framework] Primera vez o repair multi-IDE. /bienvenida = charla guiada de a un paso (checklist en silencio, pregunta de camino, /yo). Si faltan git, Ruby, gh, Node o Python, pregunta antes de instalar. /setup = repair drift. Use when the user invokes /bienvenida, /setup, or first conversation post-clone without session."
---

# dt-setup

Setup **multi-IDE**, **no destructivo**. Dos modos; el agente elige según el command invocado y el contexto.

| Command | Modo default |
|---------|----------------|
| `/bienvenida` | **first-run** — charla guiada de a un paso, sin Ruby obligatorio |
| `/setup` | **repair** — regenerar desde fuentes canónicas + `dt-doctor` |

Referencias: [`references/first-run-checklist.md`](references/first-run-checklist.md) · [`references/welcome-message.md`](references/welcome-message.md) · [`references/post-sync-pipeline.md`](references/post-sync-pipeline.md)

## Fuente de verdad

Registro de IDEs: `vitals/config/ide-targets.yaml`. No hardcodear IDEs en este skill.

## Modo A — first-run (default en `/bienvenida`)

La bienvenida es una **charla**: **un paso por mensaje**, y esperás la respuesta antes de seguir. El primer mensaje es la **Presentación** del guion (quién soy, para qué existo, objetivo, `/yo` y `/ayuda`). El camino de un clone se pregunta después, si todavía no está elegido. Guion obligatorio: [`references/welcome-message.md`](references/welcome-message.md).

El clone **ya trae** `.cursor/`, `.agents/`, `.claude/`, commands y skills en Git. El usuario **no necesita Ruby** para empezar.

1. Resolver `git_root` (multi-proyecto: `vitals/workspace.yaml` si existe).
2. Correr **en silencio** [`references/first-run-checklist.md`](references/first-run-checklist.md): paths, Git, desajuste. No lo muestres salvo que falle.
3. En silencio, `./scripts/dt-install.sh --check` (macOS) o `powershell -ExecutionPolicy Bypass -File .\scripts\dt-install.ps1 -Check` (Windows). Si sale 0, no hables de instalar. Si sale distinto de 0, guardá las líneas `✗` / `FALTA` para la pregunta de toolchain. **No instales** en este paso.
4. Si el checklist falla, mandá **M0-B**. Si no, mandá **solo la Presentación**. Esperá la respuesta.
5. Con `/yo` empieza `dt-session`. Si el check de toolchain falló y esta conversación todavía no lo preguntó, `dt-session` manda **solo** esa pregunta (guion) y espera. Recién con la respuesta sigue M1 o el paso 2. Si todavía no hay camino (clone del DT, sin `dt-upstream`, sin `/oficial`), la pregunta de camino va **después**, con el texto M1 del guion. Según la opción, registrá dt-upstream (abajo) e instalá el pre-push con `./scripts/dt-oficial.sh install-hook`.
6. `dt-session` cierra con el paso siguiente del camino. No repitas la presentación.
7. **No correr** `sync-ide` ni `dt-doctor` salvo desajuste evidente **y** que el usuario pida reparar → modo B.

### Pregunta de toolchain

Texto y opciones: [`references/welcome-message.md`](references/welcome-message.md) § Pregunta de toolchain. Una sola vez por conversación. No suma un paso del camino.

| Respuesta | Acción |
|-----------|--------|
| 1 | macOS: `./scripts/dt-install.sh` · Windows: `dt-install.ps1` sin flags |
| 2 | No instales. Seguí el guion. |
| 3 | macOS: `./scripts/dt-install.sh --full` · Windows: `dt-install.ps1 -Full` |

Mostrá el resultado del script. Si abre el diálogo de Command Line Tools, pedí que lo termine y escriba «listo» para correr el mismo comando otra vez. No commitees.

### Escrituras permitidas en first-run

Solo estas, locales y **sin commit**:

- `git remote add dt-upstream …`
- `vitals/config/dt-upstream.md` (desde `vitals/config/dt-upstream.example.md`)
- `./scripts/dt-oficial.sh install-hook`

Nada más en el repo hasta `/yo`. Si la persona eligió instalar (pregunta de toolchain), corré el script: escribe en el home (`~/.local/el-dt` o `%LOCALAPPDATA%\ElDT`) y puede anotar el PATH. No hace commit.

### Registro dt-upstream (first-run)

Si el repo parece El DT (`AGENTS.md` + `vitals/config/commands-meta.yaml`) **y** existe `origin` **y** no existe remote `dt-upstream`, la **pregunta de camino (M1)** lo resuelve. No hagas una pregunta aparte.

1. **Opción 1 o 2 → consumidor** (default en clone antes de `/bootstrap`):

   ```bash
   git remote add dt-upstream "$(git remote get-url origin)"
   ```

   Copiar `vitals/config/dt-upstream.example.md` → `vitals/config/dt-upstream.md` con `mode: consumer` y `framework_version` = contenido de `VERSION` **en ese momento** (el clone todavía trae el semver del DT). Eso **no** autoriza a escribir ese número en la app. Después de `/bootstrap`, `VERSION` es del producto y no se vuelve a copiar a `framework_version` desde `/guardar`.

2. **Opción 3 → canónico:** `mode: canonical` en el frontmatter (Fase B de `/actualizar` se omite). Eso no habilita el push. Publicar al remoto oficial exige `/oficial` en este checkout, con la sesión de GitHub del dueño.

No commitear durante `/bienvenida` salvo que el usuario pida `/guardar`. Si ese `/guardar` apunta al remoto oficial y la carpeta no está activada, el gate corta: no pidas acceso.

## Modo B — repair (default en `/setup`, drift, post-pull grande)

1. Mismos checks del modo A, incluido el `--check` del instalador.
2. Si ese check falla, mandá la pregunta de toolchain y esperá. Con **1** o **3**, corré el script que corresponde y seguí. Con **2**, no instales.
3. Si Ruby disponible → pipeline completo en [`references/post-sync-pipeline.md`](references/post-sync-pipeline.md).
4. Si Ruby **no** disponible → la estructura del clone suele bastar para usar el DT. Reparar el drift pide el perfil base; la pregunta de arriba es el camino.
5. Informar: targets `enabled` garantizados, resultado de `dt-doctor`, versión `VERSION`.

## Inferencia de modo

- `/bienvenida` → siempre first-run primero; repair solo si el checklist falla (M0-B) o el usuario pide explícitamente reparar.
- `/setup` → repair; si todo OK en checklist, reportar "estructura OK" y opcionalmente correr pipeline si Ruby hay.
- Drift tras `/actualizar` → repair (compartir pipeline con `git-actualizar` vía `post-sync-pipeline.md`).

## No hacer

- No volcar todo el guion en un mensaje: un paso por vez.
- No borrar carpetas de IDE ni usar `--solo` (eliminado).
- No tocar `vitals/ops/session.yaml`, `.env`, credenciales.
- No instalar Git/Ruby/npm sin confirmación explícita del usuario.
- No commitear durante setup.
- No pushear al remoto oficial del DT ni ofrecer pedir acceso. Publicar es `/oficial`, solo en el checkout que el dueño activó.
