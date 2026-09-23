# Sesión local (`session.yaml`)

**No hay plantilla commiteada con placeholders.** El archivo `vitals/ops/session.yaml` lo crea **`/yo`** (`dt-session`) la primera vez que alguien valida identidad. Está en `.gitignore`.

## Campos (referencia)

| Campo | Tipo | Notas |
|-------|------|--------|
| `operator.id` | string | Slug minúsculas, sin espacios |
| `operator.name` | string | Nombre para commits y `_meta` |
| `operator.role` | string | **Texto libre** del equipo, o uno de `vitals/config/roles.yaml` si el proyecto definió roles |
| `operator.email` | string | Opcional |
| `operator.inbox_path` | string | `vitals/work/inbox/{id}/` |
| `identified_at` | ISO 8601 | Última validación |
| `session_started` | ISO 8601 | Inicio de sesión de este operador |

La postura del proyecto **no** va acá. Vive en `vitals/config/collaboration.yaml` (`personal` | `team`), que sí se versiona. `/yo` la escribe y solo pregunta si el roster está vacío y el archivo no existe. Sin ese archivo, la voz es team.

Ejemplo ilustrativo (no copiar al repo; lo genera `/yo`):

```yaml
operator:
  id: ana-g
  name: "Ana García"
  role: "desarrollo"
  email: ""
  inbox_path: vitals/work/inbox/ana-g/
identified_at: "2026-05-27T10:00:00-03:00"
session_started: "2026-05-27T10:00:00-03:00"
```

Ver `docs/03_reference/dt-session-roster.md` (`DOC-REF-001`).

## Perfil de contexto (`context-profile.yaml`)

Lo crea **`/dt-config`** (`scripts/dt-context-profile.rb`). No pide `/yo` y no guarda nombre. Está en `.gitignore`, igual que la regla local `99-perfil-local` de cada IDE.

Sin ese archivo, el equipo usa el perfil **Recomendado**: personalidad, protocolos, especialistas y equipo en cada mensaje. El resto entra cuando el tema aparece.

## Checkout oficial (`canonical-checkout.yaml`)

Lo crea **`/oficial`** en la carpeta que el dueño confirma. Está en `.gitignore`. Sin ese archivo, `/guardar` no publica al remoto oficial del DT.

| Campo | Notas |
|-------|--------|
| `publisher_github_login` | Tiene que coincidir con `vitals/config/canonical-publish.yaml` y con `gh api user` |
| `origin_url` / `origin_slug` | Remoto oficial al momento de activar |
| `git_toplevel` | Ruta de esta carpeta. Una copia en otro path no publica |

## Postura local en el checkout oficial

`vitals/ops/collaboration.local.yaml` lo escribe **`/yo`** cuando esta carpeta está activada con `/oficial`. Está en `.gitignore`. El `collaboration.yaml` de Git no se usa para la postura de esa máquina, y el roster versionado se publica con `team: []`.
