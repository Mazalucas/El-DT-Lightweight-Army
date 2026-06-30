# Vitals — índice de recuperación (IA y humanos)

Usá este archivo para decidir **qué leer primero** y no inflar el contexto.

| Pregunta | Archivo |
|----------|---------|
| ¿Qué módulos / herramientas existen en el segundo cerebro? | [catalog/INDEX.md](catalog/INDEX.md) · [../BRAIN.md](../BRAIN.md) |
| ¿Cuál es el último pulso / estado reciente? | [pulse/current.md](pulse/current.md) |
| ¿Cómo escribir pulse, compactar, presupuesto de contexto? | [specs/protocolo-vitals-ia.md](specs/protocolo-vitals-ia.md) |
| ¿Memoria sugerida (inbox / accepted / opt-in)? | [memory/README.md](memory/README.md) y [specs/protocolo-memoria-dt.md](specs/protocolo-memoria-dt.md) |
| ¿Precedencia fast-lane vs no-cómplice vs seguridad? | [specs/precedence.md](specs/precedence.md) |
| ¿Multi-repo / a qué proyecto aplica un pedido de Git? | [specs/multi-project.md](specs/multi-project.md) y [workspace.yaml.example](workspace.yaml.example) |
| ¿Cuándo recomendar skills / commands al usuario? | [specs/proactive-tooling.md](specs/proactive-tooling.md) |
| ¿Atelier / design skills / anti-slop? | [specs/design-skills-protocol.md](specs/design-skills-protocol.md) · `/atelier` · `DOC-DESIGN-001` |
| ¿Referencias OpenClaw / ecosistema (diseño)? | [specs/references.md](specs/references.md) |
| ¿Plantilla de handoff entre agentes? | [relay/handoff-template.md](relay/handoff-template.md) |
| ¿Reglas sobre secretos en vitals? | [charter/no-secrets.md](charter/no-secrets.md) |
| ¿Sesión local vs roster / ritual Git? | [../docs/00_overview/cerebro-equipo-mecanismos-dt.md](../docs/00_overview/cerebro-equipo-mecanismos-dt.md) (`DOC-OV-004`) |
| ¿Commands y taglines (YAML canónico)? | [config/commands-meta.yaml](config/commands-meta.yaml) |
| ¿Quién trabaja en esta máquina? | `ops/session.yaml` (local; usar `/yo`) |
| ¿Equipo en Git? | [config/roster.yaml](config/roster.yaml) (vacío al clonar) |
| ¿Roles del proyecto? | [config/roles.yaml](config/roles.yaml) (`roles: []` = texto libre en /yo) |
| ¿Forma de session.yaml? | [ops/README.md](ops/README.md) · DOC-REF-001 |
| ¿Colaboración Git y zonas? | [../docs/06_operations/git-colaboracion-dt.md](../docs/06_operations/git-colaboracion-dt.md) (`DOC-OPS-001`) |

**Ritual de jornada:** `/actualizar` → `/yo` → trabajar → `/guardar` (ver `AGENTS.md`).

**Scripts:** [../scripts/README.md](../scripts/README.md) — `sync-commands-from-meta.sh`, `sync-skills-parity.sh`.

**Regla de oro:** en chat, citar solo `pulse_id` y ruta al entry; no pegar entries completos salvo que el usuario lo pida.
