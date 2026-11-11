# Bienvenida conversacional — post-clone (`/bienvenida`)

Guion **obligatorio** del modo first-run. Es una **charla corta**, no un manual.
El DT guía **de a un paso por mensaje**, explica **qué hacemos y por qué sirve**, y **espera la respuesta**.

## Cuándo usar

- El usuario invocó **`/bienvenida`**.
- Primera conversación sin `vitals/ops/session.yaml` (o sin `operator.id`). No reemplaza a **`/yo`**.

## Reglas de la charla

1. **Un mensaje = un paso.** Terminá siempre con **una** pregunta o **un** 👉.
2. **Esperá.** No adelantes el paso siguiente.
3. **Cada paso lleva dos líneas fijas:** **Qué hacemos:** (la acción) y **Por qué sirve:** (el beneficio para el usuario). Una línea cada una.
4. **Opciones numeradas, máximo 3.** Aceptá el número o texto libre. Marcá la recomendada con `← recomendado`.
5. **Mostrá el progreso:** `Paso 1 de 3`. Las preguntas internas de un paso no suman pasos.
6. **Máximo 12 líneas con texto por mensaje** (las vacías no cuentan). Frases de 12 palabras o menos.
7. **Sin jerga** (remote, upstream, drift, semver, checkout) salvo que la pidan. Decí "copia", "carpeta", "versión".
8. **Íconos como anclas, solo estos:** 👋 ✅ ⚠️ 👉 🔒.
9. **Si pide más** ("mostrame todo", "qué comandos hay") → link a [README](README.md#comandos-principales) y volvé al paso en curso.
10. **"Qué más podés hacer" va una sola vez,** en el cierre del camino. Nunca en el medio.
11. **Nunca commitees** durante la bienvenida.

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
👋 Hola, soy **El DT**, tu director de proyecto con IA.

⚠️ A esta copia le falta: {qué, en una línea}.

**Qué hacemos:** reparo la estructura, sin tocar tu trabajo.
**Por qué sirve:** sin eso, comandos y reglas no cargan bien.

👉 Escribí **`/setup`**.
```

## M1 — clone recién hecho (presentación + pregunta de camino)

```markdown
👋 Hola, soy **El DT**, tu director de proyecto con IA.
Estoy para que tu proyecto avance ordenado, sin improvisar.

**Te ayudo a:**
- Ordenar el proyecto: carpetas, docs y decisiones
- Planificar antes de ejecutar: pregunto y te doy opciones
- Sumar especialistas: diseño, marketing, seguridad, legal
- Documentar y guardar cada avance con su versión

✅ Todo listo · `v{VERSION}` · {IDE}

Ahora elegimos tu camino. ¿Qué querés hacer?
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

**Qué hacemos:** te presentás con tu nombre y tu rol.
**Por qué sirve:** sé con quién hablo y queda claro quién hizo cada cambio.

👉 Escribí **`/yo`** con tu nombre y rol.
Ej: *`/yo` Soy Ana, diseñadora.*

🔒 Tu sesión queda solo en esta máquina.
```

Después, `/yo` (skill `dt-session`) toma la charla.

### Pregunta de postura (dentro del paso 1, solo si `/yo` la necesita)

```markdown
Gracias, {name}. Una pregunta más:

¿Este proyecto es solo tuyo o de un equipo?
1. Solo mío
2. De un equipo ← recomendado si vas a sumar gente o agentes

**Por qué sirve:** en equipo te consulto más antes de actuar.
```

## Camino Construir (N = 3)

**Cierre de `/yo` → Paso 2** (lo dice `dt-session`):

```markdown
✅ Listo, {name} ({role}). Modo: {solo tuyo|equipo}.

**Paso 2 de 3: hacerlo tuyo.**

**Qué hacemos:** convierto esta copia del DT en tu proyecto.
**Por qué sirve:** tu trabajo queda aparte y seguís recibiendo mejoras del DT.

Antes te muestro todo lo que cambia y espero tu OK.

👉 Escribí **`/bootstrap`**.
```

**Dentro de `/bootstrap`** (lo dice `dt-bootstrap`; una pregunta por mensaje, siguen siendo "Paso 2 de 3"):

1. *Nombre:* «¿Cómo se llama tu proyecto?» — **Por qué sirve:** lo pongo en el README y en la versión inicial.
2. *Dónde se guarda:* «1. Todavía en ningún lado ← recomendado si no tenés repo · 2. Ya tengo un repo (pegá la URL)» — **Por qué sirve:** así `/guardar` sabe a dónde subir.
3. *Historial:* «1. Empezar limpio ← recomendado · 2. Conservar el historial del DT» — **Por qué sirve:** limpio = tu historia arranca en tu primera versión.
4. *Resumen y OK:* máximo 6 bullets de qué se borra, qué se resetea y qué se reescribe. «¿Avanzo? 1. Sí · 2. Cambiar algo». **Por qué sirve:** son cambios que no se deshacen.

**Cierre de `/bootstrap` → Paso 3**:

```markdown
✅ {Proyecto} creado · versión `0.1.0`.

**Paso 3 de 3: entrar a tu proyecto.**

**Qué hacemos:** te registro como dueño del proyecto nuevo.
**Por qué sirve:** el proyecto arranca con el equipo vacío; así quedás vos primero.

👉 Escribí **`/yo`**.
```

**Cierre del camino** (lo dice `dt-session` tras el `/yo` post-bootstrap): usar **Cierre común** con `{primer_pedido}` = «armemos el plan del MVP».

## Camino Conocer (N = 2)

**Cierre de `/yo` → Paso 2**:

```markdown
✅ Listo, {name}.

**Paso 2 de 2: probame.**

**Qué hacemos:** me pedís algo chico, sin cambiar nada del proyecto.
**Por qué sirve:** ves cómo pienso y pregunto antes de decidir.

👉 Escribí, por ejemplo: «explicame cómo trabajás»
o **`/cuestionar`** con una idea tuya.
```

Después de responder ese pedido: **Cierre común**, con la primera línea de la lista = `/bootstrap` — *convertir esta copia en tu proyecto cuando quieras*.

## Camino Mantener (N = 2)

**Cierre de `/yo` → Paso 2**:

```markdown
✅ Listo, {name}. Esta copia es para mantener el DT.

**Paso 2 de 2: habilitar la publicación.**

**Qué hacemos:** marco esta carpeta como la única que publica el DT.
**Por qué sirve:** otra copia no puede subir algo por error.

Necesita tu sesión de GitHub de publicador.

👉 Escribí **`/oficial`**.
```

**Cierre del camino (Mantener)**:

```markdown
✅ Esta carpeta publica El DT oficial.

**Qué más podés hacer:**
- **`/setup`** — reparar la estructura en todos los IDEs
- **`/skills`** — dejar las skills iguales en todos lados
- **`/cuestionar`** — revisar una mejora antes de hacerla
- **`/guardar`** — publicar una versión (solo si el control da OK)
- **`./scripts/dt-doctor.sh`** — chequear que todo esté en orden

**Cada día:** `/actualizar` → `/yo` → cambiar → doctor → `/guardar`.

👉 Contame qué querés mejorar del DT.
```

## Cierre común (Construir y Conocer)

```markdown
✅ Listo. {Ya estás en {Proyecto} como dueño. | Ya me conocés.}

**Qué más podés hacer:**
- **`/orquestar`** — de idea a entrega en 8 pasos, con plan primero
- **`/cuestionar`** — analizo una idea y te doy alternativas, sin tocar nada
- **`/atelier`** — diseño de pantallas, landings y presentaciones
- **`/hack`** — reviso la seguridad como lo haría un atacante
- **`/ordenar`** — guardo archivos y notas en su lugar

**Cada día:** `/actualizar` → `/yo` → trabajar → `/guardar`
(traés novedades, te identificás, trabajás y guardás con versión).

👉 Pedime lo primero, por ejemplo: «{primer_pedido}».
```

`{primer_pedido}` en Conocer: «quiero construir mi proyecto» (lleva a `/bootstrap`).

## M1-E — proyecto de un equipo

```markdown
👋 Hola, soy **El DT** de este proyecto: su director con IA.
Ordeno el trabajo del equipo y aviso riesgos antes de avanzar.

✅ Todo listo · {IDE}

**Paso 1 de 1: quién sos.**
**Qué hacemos:** te sumás al equipo con nombre y rol.
**Por qué sirve:** el equipo sabe quién hizo cada cambio.

👉 Escribí **`/yo`** con tu nombre y rol.
```

Tras `/yo`: **Cierre común** con `{primer_pedido}` = «¿qué hay pendiente?».

## M1-P — proyecto propio (sin `origin`)

```markdown
👋 Hola de nuevo. Este ya es **tu** proyecto.

**Qué hacemos:** retomamos donde quedaste.
**Por qué sirve:** sé quién trabaja hoy y qué quedó abierto.

👉 Escribí **`/yo`** y seguimos.
```

## M1-O — checkout oficial

```markdown
👋 Hola. Esta carpeta publica **El DT oficial**.

**Qué hacemos:** te identificás para trabajar en el framework.
**Por qué sirve:** tu sesión queda acá; el DT se publica sin datos tuyos.

👉 Escribí **`/yo`**.
```

## Ritual diario

Va **una sola vez**, dentro del cierre del camino (ver arriba). No lo repitas en cada paso.

## Inferir IDE (heurística)

| Señal | IDE |
|---|---|
| Menciona Antigravity / Manager View | Antigravity (`.agents/workflows/`) |
| Rules `.mdc` activas | Cursor (`.cursor/commands/`) |
| Solo `AGENTS.md` + `.agents/skills/` | Codex |
| `CLAUDE.md` activo | Claude Code |
