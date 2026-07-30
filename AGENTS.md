# AGENTS.md — puerta de entrada para la IA

Cerebro compartido de **El DT**. Reglas operativas: **`.cursor/rules/`** (Cursor) · espejos en `.claude/rules/`, `.agents/rules/` (Antigravity).

## Índice rápido

| Pregunta | Dónde |
|----------|--------|
| Ritual Git / equipo | `docs/00_overview/cerebro-equipo-mecanismos-dt.md` (`DOC-OV-004`) |
| Sesión local | `vitals/ops/session.yaml` — sin `operator.id` → **`/yo`** |
| Commands | `vitals/config/commands-meta.yaml` |
| Reglas y subagentes | `.cursor/rules/` · [README — 22 especialistas](README.md#catálogo-de-los-22-especialistas) |
| Stack web | `docs/03_reference/web-stack-default.md` · regla `08-stack-web-default` |
| Reuse / números | reglas `15-engineering-reuse`, `16-numeric-grounding` |
| Docs IA | `docs/99_meta/protocolo-documentacion-ia.md` · regla `02-documentacion` |
| Pulso / specs DT | `vitals/INDEX.md` |
| Google Drive (opcional) | `docs/02_guides/drive-cerebro-setup.md` · `/drive` |
| Atelier / marketing táctico | `.cursor/skills/atelier/` · guías `design/*/GUIDE.md`, `marketing/*/GUIDE.md` |
| Paridad multi-IDE | `vitals/config/ide-targets.yaml` · `./scripts/sync-ide.sh` |

## Ritual

Primera vez: `/bienvenida` → `/yo` → trabajar → `/guardar`  
Jornada: `/actualizar` → `/yo` → trabajar → `/guardar` (`/actualizar` no crea sesión)

## Post-clone — primera conversación (IA)

Si **no** existe `vitals/ops/session.yaml` (o falta `operator.id`) y el operador acaba de clonar o abre el repo por primera vez:

1. **Mostrar el mensaje de bienvenida canónico** — skill `dt-setup` → `.cursor/skills/dt-setup/references/welcome-message.md` (equivalente a invocar `/bienvenida`).
2. Ejecutar el checklist read-only del skill; si falta estructura → incluir **`/setup`** como paso explícito en el mensaje.
3. **No** escribir en el repo ni proponer commit hasta **`/yo`**.

Si el operador escribe **`/bienvenida`**, seguir el mismo flujo (modo first-run de `dt-setup`).

## Mantenimiento del framework

`/setup` (repair drift) · `/actualizar-dt` (upstream) · verificación: `./scripts/dt-doctor.sh`

No editar reglas/skills generados a mano en `.claude/`, `.agents/` (espejos) — fuentes en `vitals/specs/rule-bodies/` y `.cursor/skills/`.
