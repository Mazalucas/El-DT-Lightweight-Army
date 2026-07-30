# Mensaje de bienvenida — post-clone (`/bienvenida`)

Plantilla **obligatoria** de entrega en modo first-run. Completar `{placeholders}` tras el checklist. Tono: claro, no técnico salvo que el operador lo pida.

## Cuándo usar

- El usuario invocó **`/bienvenida`**.
- **Primera conversación post-clone** sin `vitals/ops/session.yaml` (o sin `operator.id`) — mostrar este mensaje aunque no digan `/bienvenida`; es read-only, no reemplaza **`/yo`** antes de escribir en el repo.

## Workflow incorporado (setup)

```text
1. Checklist (first-run-checklist.md §2–§4) — solo lectura
2. ¿Paths OK para el IDE detectado?
   → Sí: mensaje Listo + comandos recomendados + /yo
   → No: mensaje Falta X + /setup (repair) como paso explícito + opción re-clonar
3. Nunca commitear durante bienvenida salvo que pidan /guardar
```

## Plantilla de entrega (copiar y completar)

```markdown
# Bienvenida a El DT

Hola — este repo ya trae el **Director Técnico (DT)**: reglas, skills y commands para trabajar con IA en equipo.

## Estado del clone

| | |
|---|---|
| **Estado** | {Listo \| Falta: …} |
| **Versión DT** | `{VERSION}` |
| **Tu IDE** | {Cursor \| Antigravity \| Claude Code \| Codex \| Copilot \| desconocido} |
| **Commands visibles en** | {`.cursor/commands/` \| `.agents/workflows/` \| ambos según IDE} |

{Si Falta paths Antigravity:}
> **Antigravity:** skills y workflows viven en **`.agents/skills/`** y **`.agents/workflows/`** (misma carpeta). Si no ves `/bienvenida` en el chat, corré **`/setup`** o pedí a un maintainer que ejecute `./scripts/sync-commands-from-meta.sh`.

## Comandos recomendados (empezá por acá)

### Primera vez (ahora)

| Command | Para qué |
|---------|----------|
| **`/bienvenida`** | Verificar que el DT está listo (este mensaje) |
| **`/yo`** | Decir quién sos en **esta PC** — obligatorio antes de guardar trabajo |
| **`/setup`** | {Omitir si Listo \| **Usá esto ahora** si falta estructura o no cargan commands/skills} |

### Ritual del día a día

| Command | Para qué |
|---------|----------|
| **`/actualizar`** | Traer cambios del remoto (+ aviso si hay DT nuevo) |
| **`/yo`** | Refrescar sesión local tras actualizar |
| **`/guardar`** | Subir tu trabajo a GitHub |

### Cuando lo necesites

| Command | Para qué |
|---------|----------|
| **`/orquestar`** | Tarea grande — pipeline DT en 8 pasos |
| **`/drive`** | Conectar Google Drive como contexto (opcional) |
| **`/atelier`** | Diseño UI / mockups / anti-slop |
| **`/verificar`** | Planillas y totales (con script, no a ojo) |
| **`/actualizar-dt`** | Incorporar nueva versión del framework (maintainers) |

## Tarjeta rápida

```text
  bienvenida  →  yo  →  trabajar  →  guardar
  actualizar  =  al abrir el editor (después del primer día)
  setup       =  si algo del DT no carga o tras pull grande
```

## Qué NO tocamos en Git

`session.yaml`, `.env`, credenciales, `vitals/workspace.yaml` — solo en tu máquina.

---

**Siguiente paso:** escribí **`/yo`** y decime nombre y rol (ej. *Soy Ana García, analista*).
```

## Inferir IDE (heurística)

| Señal | IDE probable |
|-------|----------------|
| Usuario menciona Antigravity / Manager View | Antigravity → enfatizar `.agents/workflows/` |
| Contexto Cursor rules `.mdc` | Cursor → `.cursor/commands/` |
| Solo `AGENTS.md` + `.agents/skills/` | Codex |
| `CLAUDE.md` activo | Claude Code |

## Variante repair embebida

Si el checklist falla, **no** ocultar `/setup`. Cambiar fila de `/setup` en la tabla a **Usá esto ahora** y añadir:

```markdown
### Reparar estructura (`/setup`)

El clone parece incompleto o desactualizado. Invocá **`/setup`** — la IA ejecutará el skill `dt-setup` en modo repair (sync + `dt-doctor` si hay Ruby). Si no tenés Ruby, pedí ayuda al equipo o re-cloná.
```
