---
name: dt-session
description: "[Rutina] Crea o actualiza la sesión local con /yo — única forma de cargar identidad. En el mismo /yo resuelve la postura personal|team y solo pregunta si el roster y collaboration.yaml no la contestan. Use when the user invokes /yo or must identify who is working."
---

# dt-session

La sesión **solo existe** tras **`/yo`**. **No** uses plantillas con placeholders ni participantes de ejemplo del repo.

## Archivos

| Archivo | Git | Acción |
|---------|-----|--------|
| `vitals/ops/session.yaml` | No | Crear/actualizar al validar identidad |
| `vitals/config/roster.yaml` | Sí | Append solo si operador **nuevo** (datos reales del usuario) |
| `vitals/config/roles.yaml` | Sí | Opcional: si `roles[]` tiene entradas, validar o sugerir; si está vacío, rol = **texto libre** |
| `vitals/work/inbox/{id}/` | Sí | `mkdir -p` |
| `vitals/config/collaboration.yaml` | Sí | Escribir `posture` solo cuando se infiere o el usuario la dice |

## Checkout oficial

Si `./scripts/dt-publish-gate.sh` sale **0** o **50**, esta carpeta publica el framework. En ese caso la identidad no viaja:

- Escribí solo `vitals/ops/session.yaml`.
- La postura va a `vitals/ops/collaboration.local.yaml` (gitignored). No escribas `vitals/config/collaboration.yaml`.
- No agregues personas a `roster.yaml`. El archivo versionado se publica con `team: []`.
- No dejes notas en `vitals/work/inbox/` para commitear.
- No pidas `/guardar` para subir roster, postura ni cuaderno.

Quien clona el DT no tiene que encontrar tu sesión, tu roster ni documentación de esta interacción. Los manuales del framework sí se publican.

## Pasos

1. Corré `./scripts/dt-publish-gate.sh`. Si sale **0** o **50**, seguí **Checkout oficial** y no los pasos que escriben roster, `collaboration.yaml` o inbox en Git.
2. Si no existe `vitals/ops/session.yaml` → se crea al confirmar identidad.
3. Si hay `operator.id` + `operator.name` → **"¿Seguís como {name}?"**
   - Sí → actualizar `identified_at`.
   - No → identificación nueva (paso 4).
4. Preguntar **quién trabaja hoy**: nombre (y rol si el usuario no lo dijo).
5. `id` = slug minúsculas sin espacios (derivado del nombre si hace falta, confirmar con el usuario).
6. **Rol:** leer `vitals/config/roles.yaml`. Si `roles` tiene ítems → ofrecer lista o aceptar si el usuario ya nombró uno válido. Si `roles: []` o no existe → guardar el rol **tal como lo diga el usuario** (sin imponer `contributor`/`maintainer`/etc.).
7. **Postura, antes de tocar el roster.** En checkout oficial escribila solo en `vitals/ops/collaboration.local.yaml` y saltá el paso 8. Si no: mirar `collaboration.yaml` y `team[]` como están ahora, sin la persona de este turno. Reglas en la sección siguiente. Si falta y no se puede inferir → preguntar y no inventar. Mientras la respuesta no llegó: no escribas `collaboration.yaml` ni agregues a esta persona al roster (si no, el turno siguiente vería un roster con gente e inferiría `team`).
8. Buscar `id` en `roster.yaml` → `team[]`. Si **nuevo**: append con `name`, `role`, `email` opcional, `registered_at` (ISO 8601) y actualizar `updated` en el archivo. Si **ya está**: no duplicar ni reescribir con datos de ejemplo. Este paso corre cuando la postura ya quedó resuelta. En checkout oficial no se ejecuta.
9. Escribir `session.yaml` con `operator` (id, name, role, email, inbox_path), `identified_at`, `session_started`.
10. `mkdir -p vitals/work/inbox/{id}/` solo fuera del checkout oficial.
11. Confirmar id, nombre, rol, inbox y postura. Si hubo alta en roster o se escribió `collaboration.yaml`: recordar **`/guardar`** para subirlos. En checkout oficial no hay alta que subir.

## Postura del proyecto

No vive en `session.yaml`. Archivo Git: `vitals/config/collaboration.yaml` (`posture: personal` | `team`). Plantilla de forma: `vitals/config/collaboration.yaml.example`.

Resolvela en el **mismo** `/yo`, después de saber el nombre. No es un comando aparte y **`/bootstrap` no la pregunta**.

1. Si el usuario ya dijo `personal` o equipo/`team` en este mensaje → usar eso. No repreguntar.
2. Si `collaboration.yaml` ya tiene `posture: personal` o `team` → no preguntar. Mencionala al confirmar.
3. Si no hay postura válida y `team[]` **ya tenía** al menos una persona (`id` no vacío) antes de este `/yo` → escribir `posture: team`. No preguntar: el roster ya confirma equipo. La persona que se está identificando ahora no cuenta para esa señal.
4. Si el roster está vacío y no hay postura válida → **una** pregunta de seguimiento: ¿este checkout es para vos (`personal`) o para un equipo (`team`)? No inventes el valor.

`personal` apaga las preguntas rutinarias de la regla `01`. `team` las deja. Las compuertas (secretos, publish gate, doctor) no cambian. Sin archivo, fuera de este `/yo`, la voz sigue siendo team.

Podés escribir `session.yaml` cuando la identidad está lista aunque todavía falte la postura. No cierres `/yo` sin haber preguntado la postura si el paso 4 aplica.

```yaml
version: 1
posture: personal   # o team
```

## No hacer

- No commitear `session.yaml`.
- No escribir en `roster.yaml` nombres/roles de ejemplo del template ni placeholders.
- No inventar participantes, roles ni `posture`.
- No preguntar la postura si el roster tiene gente o si `collaboration.yaml` ya es válido.
- No meter esta entrevista en `/bootstrap`.
