# Especificación — publicación al remoto oficial del DT

Ningún checkout publica al repo oficial hasta que el dueño lo activa en esa carpeta con **`/oficial`**.

`mode: canonical` en `vitals/config/dt-upstream.md` describe el template. No es un permiso de push. `/yo` tampoco.

## Config versionada

[`vitals/config/canonical-publish.yaml`](../config/canonical-publish.yaml)

| Campo | Uso |
|-------|-----|
| `publisher_github_login` | Login de GitHub que puede publicar. Hoy `Mazalucas`. |
| `official_remotes` | URLs del mismo repo (HTTPS y SSH). El gate las normaliza a un slug. |

## Marca local (no viaja en git)

`vitals/ops/canonical-checkout.yaml` — gitignored. La escribe `./scripts/dt-oficial.sh activate --yes` después de una confirmación explícita de la ruta.

Campos: `activated_at`, `publisher_github_login`, `origin_url`, `origin_slug`, `git_toplevel`.

Si la carpeta se copia, `git_toplevel` deja de coincidir y el push queda cerrado.

## Gate

`./scripts/dt-publish-gate.sh` (mismo código: `scripts/dt-canonical-publish.rb`).

Lo corre `/guardar` antes del bump, y cualquier push. También instala `.git/hooks/pre-push`, que vuelve a aplicar el gate aunque el paso se saltee.

| Exit | Significado | Qué hacer |
|------|-------------|-----------|
| 0 | Checkout activado, ruta y login coinciden | Publicar al DT |
| 10 | El destino no es el DT | Push a ese remoto |
| 20 | No hay `origin` | Commit local. Sin push. No agregar el remoto oficial |
| 30 | El destino es el DT y esta carpeta no está activada, o la marca no coincide | Parar. Sin bump, commit ni push. Sin pedir acceso |
| 40 | La marca coincide y la sesión de GitHub no es el dueño | Parar. Sin pedir acceso ni cambiar de usuario para publicar |
| 50 | El checkout es oficial, pero el árbol lleva rastros locales (sesión, roster con personas, inbox, postura, notas) | Parar. Esos paths no entran al commit. El template sigue con `team: []` |
| 2 | `/oficial` esperando el sí de la ruta | Preguntar y esperar |

## Rastros que no viajan

Con el destino oficial, el gate y el `pre-push` miran el árbol. No entra al remoto:

- `vitals/ops/session.yaml`, la marca de `/oficial`, el perfil local y `collaboration.local.yaml` (el README y los ejemplos de `vitals/ops/` sí se publican)
- `vitals/work/inbox/` y capturas bajo `vitals/work/knowledge/` (sí el README de la zona)
- `vitals/config/collaboration.yaml`
- `vitals/config/roster.yaml` si `team` tiene personas

El commit al remoto oficial no lleva `operator_id`. Los manuales del framework sí se publican.

`/oficial off` borra la marca. El hook queda: sin marca, el push al DT sigue cerrado.

## Skills

- [`dt-oficial`](../../.cursor/skills/dt-oficial/SKILL.md)
- [`git-guardar`](../../.cursor/skills/git-guardar/SKILL.md)
