# El DT - Director Técnico para Antigravity

Este proyecto soporta **Cursor** y **Antigravity**. Setup: `/setup-antigravity` o `/setup-cursor` (solo cuando el usuario lo pida).

## Reglas

**`.agent/rules/`** — espejo de `.cursor/rules/`, incluye **`06-dt-colaboracion`** (sin sesión → pedir **`/yo`**; sesión solo local, no Git).

**Cerebro:** `docs/00_overview/cerebro-equipo-mecanismos-dt.md` · **IA:** `AGENTS.md`

## Commands = workflows

Cada command del meta existe en **`.agent/workflows/<nombre>.md`** y en **`.cursor/commands/<nombre>.md`** (generados con `scripts/sync-commands-from-meta.sh`). **No** mantener copias manuales divergentes.

## Skills

Lógica en **`.agent/skills/<nombre>/SKILL.md`**, espejo de **`.cursor/skills/`** (`scripts/sync-skills-parity.sh`).

| Ritual | Skill |
|--------|--------|
| `/actualizar` | `git-actualizar` (solo Git) |
| `/yo` | `dt-session` (crea sesión local) |
| `/guardar` | `git-guardar` |

## Ritual

```text
/actualizar  →  /yo (si no hay sesión)  →  trabajar  →  /guardar
```

`session.yaml` no se versiona.
