# AGENTS.md — puerta de entrada para la IA

Este repo es el **cerebro compartido** de El DT (Cerebro Prime / Lucas Prime). Leé esto antes de actuar a escala.

## Índice rápido

| Pregunta | Dónde |
|----------|--------|
| ¿Segundo cerebro — módulos y herramientas? | **`BRAIN.md`** · `vitals/catalog/modules.yaml` |
| ¿Cómo sincronizo y subo trabajo? | Ritual abajo + `docs/00_overview/cerebro-equipo-mecanismos-dt.md` (`DOC-OV-004`) |
| ¿Quién está en esta sesión? | `vitals/ops/session.yaml` (local) — pedir `/yo` si falta |
| ¿Equipo registrado? | `vitals/config/roster.yaml` |
| ¿Primera vez post-clone? | `/bienvenida` → `/yo` |
| ¿Lista de commands y taglines? | `vitals/config/commands-meta.yaml` |
| ¿Reglas del DT? | `.cursor/rules/` o `.agent/rules/` |
| ¿Stack web default (Firebase + Node)? | `vitals/data/engineering/web-stack.yaml` |
| ¿Actualizar framework DT en este proyecto? | `/actualizar-dt` · `vitals/config/dt-upstream.md` |
| ¿Pulso y specs? | `vitals/INDEX.md` |
| ¿Documentación humana? | `docs/README.md` (`DOC-OV-001`) |
| ¿Subagentes y skills? | [README#subagentes](README.md) · marketing: `.cursor/skills/marketing/` · **Atelier**: `.cursor/skills/design/` · **Remotion**: [`tools/remotion/`](tools/remotion/) |
| ¿Tools reutilizables? | [`tools/REGISTRY.md`](tools/REGISTRY.md) |

## Ritual post-clone (primera vez)

```text
/bienvenida  →  /yo  →  trabajar  →  /guardar
```

## Ritual de jornada (obligatorio en equipo)

```text
/actualizar  →  /yo  →  trabajar  →  /guardar
```

- **`/actualizar`** — skill `git-actualizar`: sync del proyecto + consulta upstream DT (Fase B, aviso); **no** toca `session.yaml`
- **`/yo`** — skill `dt-session`: identidad local + roster si nuevo
- **`/guardar`** — skill `git-guardar`: commit + push **sin** `session.yaml`

**Sin sesión válida** (`vitals/ops/session.yaml` con `operator.id`): **pedí `/yo`** antes de escribir o commitear.

## Commands por grupo

Fuente canónica: **`vitals/config/commands-meta.yaml`**

### Rutina

| Command | Skill |
|---------|--------|
| `/bienvenida` | `dt-setup` (first-run) |
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
| `/setup` | Verificar/reparar drift multi-IDE (skill `dt-setup`) |
| `/bootstrap` | Promover DT al raíz en proyecto nuevo (skill `dt-bootstrap`) |
| `/actualizar-dt` | Incorporar release del framework desde `dt-upstream` |
| `/github-save-small` | Skill `github-save-release` |

### Diseño (Atelier)

| Command | Skill |
|---------|--------|
| `/atelier` | `atelier` — init, select, craft, audit, … |

### Video programático (Remotion)

| Command | Skill |
|---------|--------|
| `/remotion` | `remotion-producer` |

### Módulos (Cerebro Prime)

| Command | Skill |
|---------|--------|
| `/nueva-factura` | `nueva-factura` |
| `/recordatorio` | `recordatorio` |
| `/recordatorios` | `recordatorios` (deprecated → cerebro-profesional) |
| `/cerebro-profesional` | `cerebro-profesional` |
| `/sincronizar-notas-meet` | `sincronizar-notas-meet` |
| `/CerebroWork` · `/cerebro-work` | `cerebro-work` |
| `/indexar-reuniones` | `indexar-reuniones` |
| `/procesar-reuniones` | `procesar-reuniones` |
| `/start` | `start` — Cerebro App (dev local) |
| `/deploy` | `deploy` — Firebase producción |

## Paridad multi-IDE

IDEs soportados: **`vitals/config/ide-targets.yaml`** (Cursor, Antigravity, Claude Code, Codex, …).

- **Reglas:** `vitals/specs/rule-bodies/` + `vitals/config/rules-manifest.yaml` → `./scripts/sync-ide.sh`
- **Commands:** `vitals/config/commands-meta.yaml` → `./scripts/sync-commands-from-meta.sh`
- **Skills:** `.cursor/skills/` → `./scripts/sync-skills-parity.sh` / `sync-ide.sh`

**Verificación:** `./scripts/dt-doctor.sh`

## Reglas siempre activas relevantes

- `00-orquestador-core` — macro pipeline
- `01-protocolos-dt` — no cómplice, alternativas, puntos ciegos
- `02-documentacion` — protocolo `docs/`
- `07-orden-continuo` — loop autónomo (`dt-doctor`)
- `06-dt-colaboracion` — sesión, zonas, `_meta` en pulse
- `05-multi-project-git` — si existe `vitals/workspace.yaml`
- `08-stack-web-default` — stack Firebase + Node
- `15-engineering-reuse` — discover before create

Precedencia: `vitals/specs/precedence.md`

## Subagentes (21)

Reglas de delegación: `.cursor/rules/03-catalogo-subagentes.mdc`.

| Grupo | Subagentes |
|-------|------------|
| Engineering | arquitecto, frontend, devops, ui-designer, **remotion-producer** |
| Planning | prd-creator, srd-creator, development-planner |
| Testing | qa |
| Design & UX | ux-researcher |
| Product | product-strategist, feedback-synthesizer, researcher |
| Documentation | doc |
| Marketing & Content | content-creator, **marketing-strategist** (+42 tácticas), brand-guardian, growth-hacker, pitch-specialist, storytelling-specialist |
| Operations | operations-maintainer |

**Marketing táctico:** `.cursor/skills/marketing/` · contexto `.agents/product-marketing.md` (local).

**Atelier:** `.cursor/skills/design/` · `/atelier` · contexto `.agents/design-context.md` (local).

**Remotion:** [`tools/remotion/`](tools/remotion/) · `.cursor/skills/remotion-best-practices/` · `/remotion`.

## Versión del framework DT

Semver incorporado: **`vitals/config/dt-upstream.md`** → `framework_version` (actual: **1.7.2**). Remote: `dt-upstream`.
