# Colaboración DT (sesión e identidad)

## Identidad en conversación (obligatorio)

Antes de **escribir** en el repo, proponer **commit/push**, crear pulse, o ejecutar trabajo sustantivo:

1. Leer `vitals/ops/session.yaml` si existe.
2. Si el archivo **no existe** o `operator.id` está vacío/ausente → **detener** escrituras sustantivas y pedir **`/yo`**, **salvo** onboarding read-only: mensaje de bienvenida post-clone o **`/bienvenida`** (skill `dt-setup` → `welcome-message.md`).
3. Si el usuario ya dijo quién es pero no corrió `/yo` → invitar a **`/yo`** para cargar la sesión local; no seguir con escrituras atribuidas.

La sesión se **crea y completa solo con `/yo`** (skill `dt-session`).

**`/actualizar`** solo sincroniza Git; **no** crea ni borra sesión.

`vitals/ops/session.yaml` **no se versiona** — solo local.

## Roster y roles (sin hardcode del template)

- **`roster.yaml`**: solo personas reales añadidas por `/yo`; el template parte con `team: []`.
- **`roles.yaml`**: opcional; `roles: []` = rol en texto libre. Si el proyecto define roles, usarlos para validar/sugerir — **no** imponer roles del framework.

## Zonas

| Zona | Path |
|------|------|
| Inbox personal | `vitals/work/inbox/{operator_id}/` |
| Pulse | `vitals/pulse/entries/` con `_meta.operator_id` si aplica |

Detalle: `docs/06_operations/git-colaboracion-dt.md` (`DOC-OPS-001`), `docs/03_reference/dt-session-roster.md` (`DOC-REF-001`).

## `/guardar`

Excluir: `session.yaml`, `.env`, `*.credentials`, `vitals/workspace.yaml`. Requiere sesión válida (`/yo` previo).

Referencia: `docs/00_overview/cerebro-equipo-mecanismos-dt.md` (`DOC-OV-004`)
