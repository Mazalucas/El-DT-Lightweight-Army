# El DT - Director Técnico para Antigravity

Este proyecto soporta **multi-IDE** (Cursor, Antigravity, Claude Code, Codex, GitHub Copilot). Registro: `vitals/config/ide-targets.yaml`.

**Primera vez:** `/bienvenida` (mensaje con commands recomendados + checklist; si falta algo → `/setup`) → `/yo`. **Repair:** `/setup`.

## Reglas

**`.agents/rules/`** — espejo de `.cursor/rules/`, incluye **`06-dt-colaboracion`** (sin sesión → pedir **`/yo`**; sesión solo local, no Git).

**Cerebro:** `docs/00_overview/cerebro-equipo-mecanismos-dt.md` · **IA:** `AGENTS.md`

## Commands = workflows

Cada command del meta existe en **`.agents/workflows/<nombre>.md`** y en **`.cursor/commands/<nombre>.md`** (generados con `scripts/sync-commands-from-meta.sh`). **No** mantener copias manuales divergentes.

## Skills

Lógica en **`.agents/skills/<nombre>/SKILL.md`**, espejo de **`.cursor/skills/`** (`scripts/sync-ide.sh` / `sync-skills-parity.sh`).

| Ritual | Skill |
|--------|--------|
| `/bienvenida` | `dt-setup` (first-run) |
| `/setup` | `dt-setup` (repair) |
| `/actualizar` | `git-actualizar` (solo Git) |
| `/yo` | `dt-session` (crea sesión local) |
| `/guardar` | `git-guardar` |

### Subagentes (20)

Cada rol: **`.agents/skills/{nombre}/SKILL.md`**. Definiciones Cursor: **`.cursor/agents/{nombre}.md`**.

Catálogo completo (20 filas + 42 skills de marketing): [README — Subagentes (20)](README.md#subagentes-20).

Tras editar skills en Cursor, corré `./scripts/sync-skills-parity.sh` o `./scripts/sync-ide.sh`.

## Ritual

```text
/bienvenida  →  /yo  →  trabajar  →  /guardar
/actualizar  =  cuando el remoto tenga novedades
```

`session.yaml` no se versiona.
