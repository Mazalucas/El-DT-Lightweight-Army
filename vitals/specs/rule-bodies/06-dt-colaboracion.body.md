# Colaboración DT (sesión e identidad)

## Identidad en conversación (obligatorio)

Antes de **escribir** en el repo, proponer **commit/push**, crear pulse, o ejecutar trabajo sustantivo:

1. Leer `vitals/ops/session.yaml` si existe.
2. Si el archivo **no existe** o `operator.id` está vacío/ausente → **detener** escrituras sustantivas y pedir **`/yo`**, **salvo**:
   - onboarding read-only: mensaje de bienvenida post-clone o **`/bienvenida`** (skill `dt-setup` → `welcome-message.md`);
   - **`/dt-config`**: solo el perfil local de contexto (gitignored). No escribe sesión ni roster.
3. Si el usuario ya dijo quién es pero no corrió `/yo` → invitar a **`/yo`** para cargar la sesión local; no seguir con escrituras atribuidas.

La sesión se **crea y completa solo con `/yo`** (skill `dt-session`).

**`/actualizar`** solo sincroniza Git; **no** crea ni borra sesión.

`vitals/ops/session.yaml` **no se versiona** — solo local.

## Roster y roles (sin hardcode del template)

- **`roster.yaml`**: solo personas reales añadidas por `/yo`; el template parte con `team: []`. En el checkout oficial (`/oficial` activo) `/yo` no escribe este archivo: la identidad queda en `session.yaml` y la postura en `vitals/ops/collaboration.local.yaml`.
- **`roles.yaml`**: opcional; `roles: []` = rol en texto libre. Si el proyecto define roles, usarlos para validar/sugerir — **no** imponer roles del framework.

## Postura (personal | team)

No vive en `session.yaml`. Archivo Git: `vitals/config/collaboration.yaml`. Lo resuelve **`/yo`** (skill `dt-session`), en el mismo turno que la identidad. Solo pregunta si hace falta:

- El archivo ya dice `personal` o `team` → no preguntar.
- `roster.yaml` con al menos una persona **antes** de este `/yo`, y sin archivo válido → `team`, escribir el archivo, no preguntar. Quien se identifica ahora no cuenta.
- Roster vacío y sin archivo válido → una pregunta de seguimiento. No inventar el valor.

Sin el archivo, las escrituras no se bloquean: la voz default es team (regla `01`). `/bootstrap` no entrevista; al resetear el template borra `collaboration.yaml` para que el proyecto nuevo responda en el primer `/yo`.

## Zonas

| Zona | Path |
|------|------|
| Inbox personal | `vitals/work/inbox/{operator_id}/` |
| Pulse | `vitals/pulse/entries/` con `_meta.operator_id` si aplica |

Detalle: `docs/06_operations/git-colaboracion-dt.md` (`DOC-OPS-001`), `docs/03_reference/dt-session-roster.md` (`DOC-REF-001`).

## Push al remoto oficial del DT

Antes de cualquier `git push`, de un commit que vaya a publicarse, o de `/guardar`:

1. Corré `./scripts/dt-publish-gate.sh`.
2. El script instala un `pre-push` local. Ese hook frena un push posterior aunque este paso se saltee.
3. Leé `DT_PUBLISH_GATE exit=`:
   - `0` — este checkout está activado con `/oficial` y no hay rastros personales en el árbol. Se puede publicar el framework. El commit no lleva `operator_id`.
   - `50` — el checkout es oficial, pero hay sesión, roster con personas, inbox, postura o notas. No las subas. `roster.yaml` se publica con `team: []`.
   - `10` — `origin` es otro repo. El push va ahí.
   - `20` — no hay `origin`. Commit local permitido. Sin push. No agregues el remoto oficial.
   - `30` o `40` — `origin` es el DT oficial y este checkout no puede publicar. Pará antes del bump, del commit y del push. No pidas acceso, no invites colaboradores y no sugieras `gh auth` para publicar el DT. Otro proyecto: stash si hace falta, `/bootstrap`, remoto propio. Traer el framework: `/actualizar-dt`. El dueño, en la carpeta del DT: `/oficial`.

`mode: canonical` y `/yo` no autorizan el push. El permiso es `vitals/ops/canonical-checkout.yaml`, local y gitignored, escrito solo por `/oficial`.

Spec: `vitals/specs/canonical-publish.md`.

## `/guardar`

Excluir: `session.yaml`, `canonical-checkout.yaml`, `context-profile.yaml`, `99-perfil-local`, `.env`, `*.credentials`, `vitals/workspace.yaml`. Requiere sesión válida (`/yo` previo) y el gate de arriba. `/dt-config` no autoriza este paso.

Referencia: `docs/00_overview/cerebro-equipo-mecanismos-dt.md` (`DOC-OV-004`)
