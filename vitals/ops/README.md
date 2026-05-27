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
