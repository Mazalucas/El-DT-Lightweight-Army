# Protocolo Vitals orientado a IA

## Objetivo

Definir cómo organizar `vitals/` para **recuperación eficiente de contexto** (alineado al principio de DOC-META-001: maximizar información útil por token), sin depender de pegar historial largo en el chat.

## Principios

1. **Índice primero:** Toda sesión que necesite contexto de telemetría debe empezar por [../INDEX.md](../INDEX.md) y [../pulse/current.md](../pulse/current.md).
2. **Puntero corto:** `pulse/current.md` nunca debe superar ~15 líneas de estado; el detalle vive en `pulse/entries/`.
3. **Un evento = un entry:** Archivos pequeños en `pulse/entries/YYYY-MM-DD-<pulse_id>.md` con metadatos mínimos (ver abajo).
4. **Sin secretos:** Ver [../charter/no-secrets.md](../charter/no-secrets.md).
5. **Modularidad normativa:** La política larga vive en `specs/`; los entries solo enlazan a specs, no duplican párrafos enteros.
6. **Compactación con opt-in:** Si hay muchos entries en un período, el DT puede **proponer** un `pulse/snapshots/YYYY-MM.md` con decisiones y enlaces. No borrar entries sin confirmación humana.

## Metadatos mínimos por entry (`pulse/entries/`)

Cada entry debe incluir en frontmatter YAML o cabecera clara:

- `pulse_id` — identificador único (p. ej. `dt-20260419-001`)
- `timestamp` — ISO 8601
- `agent_id` — p. ej. `dt`, `qa`, `doc`
- `project_id` o `git_root` — obligatorio si el workspace es multi-repo (ver [multi-project.md](multi-project.md))
- `summary` — una línea
- `artifacts` — rutas o comandos relevantes (opcional)
- `related_doc_ids` — opcional (`DOC-*`)
- `git_ref` — commit o branch (opcional)

## Presupuesto de contexto (chat)

- No pegar el contenido completo de múltiples entries en el chat.
- Preferir: `pulse_id` + ruta + 2–3 bullets de resumen.
- Para auditoría profunda, el usuario abre el archivo o pide leer un entry concreto.

## Relación con documentación del producto (`docs/`)

- `docs/` = conocimiento de producto y proyecto.
- `vitals/` = telemetría y normativa **del orquestador** y del uso de agentes en este repo.
- Si un cambio normativo afecta cómo se documenta el producto, seguir DOC-META-001 y registrar el pulso que enlace al PR.

## Opcional: base de datos local

No es requisito del protocolo. Los archivos Markdown en git priorizan auditabilidad y diffs. Una DB local (p. ej. SQLite) solo tendría sentido como **fase opcional** para equipos con volumen muy alto; el cuello de contexto del LLM se resuelve con índice + puntero, no con DB.
