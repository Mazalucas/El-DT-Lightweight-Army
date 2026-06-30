---
name: dt-session
description: "[Rutina] Crea o actualiza la sesión local con /yo — única forma de cargar identidad. Use when the user invokes /yo or must identify who is working."
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

## Pasos

1. Si no existe `vitals/ops/session.yaml` → se crea al confirmar identidad.
2. Si hay `operator.id` + `operator.name` → **"¿Seguís como {name}?"**
   - Sí → actualizar `identified_at`.
   - No → identificación nueva (paso 3).
3. Preguntar **quién trabaja hoy**: nombre (y rol si el usuario no lo dijo).
4. `id` = slug minúsculas sin espacios (derivado del nombre si hace falta, confirmar con el usuario).
5. **Rol:** leer `vitals/config/roles.yaml`. Si `roles` tiene ítems → ofrecer lista o aceptar si el usuario ya nombró uno válido. Si `roles: []` o no existe → guardar el rol **tal como lo diga el usuario** (sin imponer `contributor`/`maintainer`/etc.).
6. Buscar `id` en `roster.yaml` → `team[]`. Si **nuevo**: append con `name`, `role`, `email` opcional, `registered_at` (ISO 8601) y actualizar `updated` en el archivo. Si **ya está**: no duplicar ni reescribir con datos de ejemplo.
7. Escribir `session.yaml` con `operator` (id, name, role, email, inbox_path), `identified_at`, `session_started`.
8. `mkdir -p vitals/work/inbox/{id}/`
9. Confirmar id, nombre, rol, inbox. Si hubo alta en roster: recordar **`/guardar`** para subir `roster.yaml`.

## No hacer

- No commitear `session.yaml`.
- No escribir en `roster.yaml` nombres/roles de ejemplo del template ni placeholders.
- No inventar participantes ni roles por defecto.
