# AGENTS.md — puerta de entrada para la IA

Este repo es el **cerebro compartido** de El DT. Leé esto antes de actuar a escala.

## Índice rápido

| Pregunta | Dónde |
|----------|--------|
| ¿Segundo cerebro — módulos y herramientas? | **`BRAIN.md`** · `vitals/catalog/modules.yaml` |
| ¿Cómo sincronizo y subo trabajo? | Ritual abajo + `docs/00_overview/cerebro-equipo-mecanismos-dt.md` (`DOC-OV-004`) |
| ¿Quién está en esta sesión? | `vitals/ops/session.yaml` (local) — pedir `/yo` si falta |
| ¿Equipo registrado? | `vitals/config/roster.yaml` |
| ¿Lista de commands y taglines? | `vitals/config/commands-meta.yaml` |
| ¿Reglas del DT? | `.cursor/rules/` o `.agent/rules/` |
| ¿Pulso y specs? | `vitals/INDEX.md` |
| ¿Documentación humana? | `docs/README.md` (`DOC-OV-001`) |
| ¿Subagentes y skills? | [README#subagentes-20](README.md#subagentes-20) · marketing táctico: `.cursor/skills/marketing/` |

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
| `/exit` | `exit` — cierra dev servers Vite de módulos (5173–5182) |

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

### Módulos

| Command | Skill |
|---------|--------|
| `/nueva-factura` | `nueva-factura` — app facturas autónomo (Vite) |
| `/recordatorio` | `recordatorio` — crear recordatorio desde chat (cola local) |
| `/recordatorios` | `recordatorios` — app web de recordatorios (Vite, puerto 5181) |
| `/cerebro-profesional` | `cerebro-profesional` — reuniones, contactos, búsqueda (puerto 5182) |
| `/sincronizar-notas-meet` | `sincronizar-notas-meet` — notas Gemini → Markdown local |
| `/CerebroWork` · `/cerebro-work` | `cerebro-work` — atajo: `./scripts/sync-meet-notes.sh` desde raíz |
| `/indexar-reuniones` | `indexar-reuniones` — manifest Meet sin descargar contenido |
| `/procesar-reuniones` | `procesar-reuniones` — análisis Cursor sobre `.md` locales |
| `/start` | `start` — Cerebro App, webapp unificada (dev local) |
| `/deploy` | `deploy` — build + Firebase deploy (producción) |

## Paridad multi-IDE

Cada command debe existir en **`.cursor/commands/`** y **`.agent/workflows/`**; cada skill de rutina en **`.cursor/skills/`** y **`.agent/skills/`**. Tras cambios: `./scripts/sync-commands-from-meta.sh` y `./scripts/sync-skills-parity.sh`.

## Reglas siempre activas relevantes

- `00-orquestador-core` — macro pipeline
- `01-protocolos-dt` — no cómplice, alternativas, puntos ciegos
- `02-documentacion` — protocolo `docs/`
- `06-dt-colaboracion` — sesión, zonas, `_meta` en pulse
- `05-multi-project-git` — si existe `vitals/workspace.yaml`

Precedencia: `vitals/specs/precedence.md`

## Subagentes (20)

Tabla maestra con agente, skill de rol y keywords: **[README — Subagentes (20)](README.md#subagentes-20)**. Reglas de delegación: `.cursor/rules/03-catalogo-subagentes.mdc`.

| Grupo | Subagentes |
|-------|------------|
| Engineering | arquitecto, frontend, devops, ui-designer |
| Planning | prd-creator, srd-creator, development-planner |
| Testing | qa |
| Design & UX | ux-researcher |
| Product | product-strategist, feedback-synthesizer, researcher |
| Documentation | doc |
| Marketing & Content | content-creator, **marketing-strategist** (+42 tácticas), brand-guardian, growth-hacker, pitch-specialist, storytelling-specialist |
| Operations | operations-maintainer |

**Marketing táctico:** `.cursor/skills/marketing/` · Antigravity: `.agent/skills/marketing/` · contexto `.agents/product-marketing.md` (local).

## Versión del template

`VERSION` en la raíz (semver del framework).
