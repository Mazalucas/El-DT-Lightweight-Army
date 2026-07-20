# AGENTS.md — puerta de entrada para la IA

Cerebro compartido de **El DT**. Reglas operativas: **`.cursor/rules/`** (Cursor) · espejos en `.claude/rules/`, `.agent/rules/`.

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
| Atelier / marketing táctico | `.cursor/skills/atelier/` · guías `design/*/GUIDE.md`, `marketing/*/GUIDE.md` |
| Paridad multi-IDE | `vitals/config/ide-targets.yaml` · `./scripts/sync-ide.sh` |

## Ritual

Primera vez: `/bienvenida` → `/yo` → trabajar → `/guardar`  
Jornada: `/actualizar` → `/yo` → trabajar → `/guardar` (`/actualizar` no crea sesión)

## Mantenimiento del framework

`/setup` (repair drift) · `/actualizar-dt` (upstream) · verificación: `./scripts/dt-doctor.sh`

No editar reglas/skills generados a mano en `.claude/`, `.agent/` — fuentes en `vitals/specs/rule-bodies/` y `.cursor/skills/`.
