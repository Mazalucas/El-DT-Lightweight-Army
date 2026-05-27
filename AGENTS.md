# AGENTS.md — puerta de entrada para la IA

Este repo es el **cerebro compartido** de El DT. Leé esto antes de actuar a escala.

## Índice rápido

| Pregunta | Dónde |
|----------|--------|
| ¿Cómo sincronizo y subo trabajo? | Ritual abajo + `docs/00_overview/cerebro-equipo-mecanismos-dt.md` (`DOC-OV-004`) |
| ¿Quién está en esta sesión? | `vitals/ops/session.yaml` (local) — pedir `/yo` si falta |
| ¿Equipo registrado? | `vitals/config/roster.yaml` |
| ¿Lista de commands y taglines? | `vitals/config/commands-meta.yaml` |
| ¿Reglas del DT? | `.cursor/rules/` o `.agent/rules/` |
| ¿Pulso y specs? | `vitals/INDEX.md` |
| ¿Documentación humana? | `docs/README.md` (`DOC-OV-001`) |

## Ritual de jornada (obligatorio en equipo)

```text
/actualizar  →  /yo  →  trabajar  →  /guardar
```

- **`/actualizar`** — skill `git-actualizar`: pull + **reset** de `session.yaml`
- **`/yo`** — skill `dt-session`: identidad local + roster si nuevo
- **`/guardar`** — skill `git-guardar`: commit + push **sin** `session.yaml`

**Sin sesión válida** (`vitals/ops/session.yaml` con `operator.id`): **pedí `/yo`** antes de escribir o commitear. La sesión **solo se crea con `/yo`**, no con `/actualizar`.

**`/actualizar`** solo hace `git pull`; no toca `session.yaml` (archivo **local**, no va a Git).

## Commands por grupo

Fuente canónica: **`vitals/config/commands-meta.yaml`**

### Rutina

| Command | Skill |
|---------|--------|
| `/actualizar` | `git-actualizar` |
| `/yo` | `dt-session` |
| `/guardar` | `git-guardar` |

### Trabajo

| Command | Notas |
|---------|--------|
| `/orquestar` | 8 pasos — ver `.cursor/commands/orquestar.md` |
| `/fast-lane` | Alcance cerrado; seguridad siempre |
| `/cuestionar` | Solo análisis |
| `/contexto` | Mapa del repo |
| `/prepr` | Preparar PR |

### Framework

| Command | Notas |
|---------|--------|
| `/setup-cursor` | Solo Cursor |
| `/setup-antigravity` | Solo Antigravity |
| `/github-save-small` | Skill `github-save-release` (mismas exclusiones que guardar) |

## Paridad multi-IDE

Cada command debe existir en **`.cursor/commands/`** y **`.agent/workflows/`**; cada skill de rutina en **`.cursor/skills/`** y **`.agent/skills/`**. Tras cambios: `./scripts/sync-commands-from-meta.sh` y `./scripts/sync-skills-parity.sh`.

## Reglas siempre activas relevantes

- `00-orquestador-core` — macro pipeline
- `01-protocolos-dt` — no cómplice, alternativas, puntos ciegos
- `02-documentacion` — protocolo `docs/`
- `06-dt-colaboracion` — sesión, zonas, `_meta` en pulse
- `05-multi-project-git` — si existe `vitals/workspace.yaml`

Precedencia: `vitals/specs/precedence.md`

## Subagentes

20 roles — catálogo en `.cursor/rules/03-catalogo-subagentes.mdc`. Al delegar, incluir protocolos DT.

## Versión del template

`VERSION` en la raíz (semver del framework).
