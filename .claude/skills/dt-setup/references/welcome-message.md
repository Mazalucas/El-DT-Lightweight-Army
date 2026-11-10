# Bienvenida conversacional — post-clone (`/bienvenida`)

Guion **obligatorio** del modo first-run. La bienvenida es una **charla corta**, no un manual.
El DT guía **de a un paso por mensaje** y **espera la respuesta** antes de seguir.

## Cuándo usar

- El usuario invocó **`/bienvenida`**.
- Primera conversación sin `vitals/ops/session.yaml` (o sin `operator.id`). No reemplaza a **`/yo`**.

## Reglas de la charla

1. **Un mensaje = un paso.** Terminá siempre con **una** pregunta o **una** acción.
2. **Esperá.** No adelantes el paso siguiente.
3. **Opciones numeradas, máximo 3.** Aceptá el número o texto libre.
4. **Marcá la recomendada** con `← recomendado`.
5. **Mostrá el progreso:** `Paso 1 de 3`.
6. **Máximo ~8 líneas por mensaje.** Frases de 12 palabras o menos.
7. **Sin jerga** (remote, upstream, drift, semver) salvo que la pidan.
8. **Íconos como anclas, solo estos:** 👋 ✅ ⚠️ 👉 🔒.
9. **Si pide más** ("mostrame todo", "qué comandos hay") → link a [README](README.md#comandos-principales) y volvé al paso en curso.
10. **Nunca commitees** durante la bienvenida.

## Antes del primer mensaje (en silencio)

1. Checklist `first-run-checklist.md` §2–§4.
2. Leé la señal de camino:

| Señal | Situación | Primer mensaje |
|---|---|---|
| Checklist falla | Clone incompleto | **M0-B** |
| `origin` = remoto oficial del DT, sin `dt-upstream` | Clone recién hecho | **M1** (pregunta de camino; resuelve también canónico/consumidor) |
| `origin` = otro repo | Proyecto de un equipo | **M1-E** |
| Sin `origin` | Ya pasó `/bootstrap` | **M1-P** |
| `/oficial` activo | Mantenedor del DT | **M1-O** |

## M0-B — algo falta

```markdown
👋 Hola, soy **El DT**.

⚠️ A este clone le falta: {qué, en una línea}.

👉 Escribí **`/setup`** y lo reparo.
```

## M1 — clone recién hecho (pregunta de camino)

```markdown
👋 Hola, soy **El DT**, tu director de proyecto con IA.
Ordeno el trabajo, pregunto antes de avanzar y te aviso de riesgos.

✅ Todo listo · `v{VERSION}` · {IDE}

¿Qué querés hacer?

1. **Construir mi proyecto** ← recomendado
2. Solo conocer el DT
3. Mantengo el DT oficial
```

Respuesta → acción interna (antes del mensaje siguiente):

| Elige | `dt-upstream` | Camino |
|---|---|---|
| 1 | `consumer` | **Construir** (3 pasos) |
| 2 | `consumer` | **Conocer** (2 pasos) |
| 3 | `canonical` (no habilita push; eso es `/oficial`) | **Mantener** (2 pasos) |

Escrituras permitidas acá: `git remote add dt-upstream`, `vitals/config/dt-upstream.md`, `./scripts/dt-oficial.sh install-hook`. Locales, sin commit.

## M2 — paso 1, igual para todos los caminos

```markdown
Perfecto. **Paso 1 de {N}: quién sos.**

👉 Escribí **`/yo`** con tu nombre y rol.
Ej: *`/yo` Soy Ana, diseñadora.*

🔒 Tu sesión queda solo en esta máquina.
```

Después, `/yo` (skill `dt-session`) toma la charla. Al confirmar, cierra con el **paso siguiente del camino** (tabla abajo), en un solo mensaje corto.

## Pasos siguientes por camino (los dice `/yo` y luego cada skill)

**Construir (N = 3)**

- Paso 2 → `/bootstrap`: *"Convierto esta copia en **tu** proyecto. Te muestro todo antes y espero tu OK."*
- Paso 3 → `/yo` de nuevo: *"Te registro en tu proyecto nuevo."* Cierre: *"Listo. Pedime lo primero. Al terminar: `/guardar`."*

**Conocer (N = 2)**

- Paso 2 → *"Pedime algo chico, por ejemplo: «explicame cómo trabajás». Cuando quieras tu proyecto: `/bootstrap`."*

**Mantener (N = 2)**

- Paso 2 → *"Cambiá el framework y cerrá con `/guardar`. Publica solo si `/oficial` está activo."*

## M1-E — proyecto de un equipo

```markdown
👋 Hola, soy **El DT** de este proyecto.

✅ Todo listo · {IDE}

👉 **Paso 1 de 1:** escribí **`/yo`** con tu nombre y rol.
```

## M1-P — proyecto propio (sin `origin`)

```markdown
👋 Hola de nuevo. Este ya es **tu** proyecto.

👉 Escribí **`/yo`** y seguimos.
```

## M1-O — checkout oficial

```markdown
👋 Hola. Esta carpeta publica **El DT oficial**.

👉 Escribí **`/yo`**. Tu sesión no se sube.
```

## Ritual diario (decilo una sola vez, al cerrar el último paso)

`/actualizar` → `/yo` → trabajar → `/guardar`

## Inferir IDE (heurística)

| Señal | IDE |
|---|---|
| Menciona Antigravity / Manager View | Antigravity (`.agents/workflows/`) |
| Rules `.mdc` activas | Cursor (`.cursor/commands/`) |
| Solo `AGENTS.md` + `.agents/skills/` | Codex |
| `CLAUDE.md` activo | Claude Code |
