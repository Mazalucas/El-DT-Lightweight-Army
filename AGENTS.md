# AGENTS.md — puerta de entrada para la IA

Este repo es el **cerebro compartido** de El DT. Leé esto antes de actuar a escala.

## Índice rápido

| Pregunta | Dónde |
|----------|--------|
| ¿Cómo sincronizo y subo trabajo? | Ritual abajo + `docs/00_overview/cerebro-equipo-mecanismos-dt.md` (`DOC-OV-004`) |
| ¿Quién está en esta sesión? | `vitals/ops/session.yaml` (local) — pedir `/yo` si falta |
| ¿Equipo registrado? | `vitals/config/roster.yaml` |
| ¿Primera vez post-clone? | `docs/02_guides/primer-setup-dt.md` (`DOC-GUIDE-006`) — `/bienvenida` → `/yo` |
| ¿Lista de commands y taglines? | `vitals/config/commands-meta.yaml` |
| ¿Reglas del DT? | `.cursor/rules/` o `.agent/rules/` |
| ¿Stack web default (Firebase + Node)? | `docs/03_reference/web-stack-default.md` (`DOC-REF-005`) · `vitals/data/engineering/web-stack.yaml` |
| ¿Reuse-first (código)? | `docs/03_reference/engineering-reuse-default.md` (`DOC-REF-006`) · skill `engineering-reuse` · regla `15-engineering-reuse` |
| ¿Números, planillas, reportes? | `docs/03_reference/numeric-verification-default.md` (`DOC-REF-009`) · skill `data-auditor` · regla `16-numeric-grounding` · `/verificar` |
| ¿Actualizar framework DT en mi proyecto? | `docs/02_guides/actualizar-framework-dt.md` (`DOC-GUIDE-007`) · `/actualizar-dt` |
| ¿Pulso y specs? | `vitals/INDEX.md` |
| ¿Documentación humana? | `docs/README.md` (`DOC-OV-001`) |
| ¿Subagentes y skills? | [README#catálogo-de-los-22-especialistas](README.md#catálogo-de-los-22-especialistas) · marketing: `.cursor/skills/marketing/` · **Atelier**: `.cursor/skills/design/` · **Remotion**: [`tools/remotion/`](tools/remotion/) + `.cursor/skills/remotion-best-practices/` |
| ¿Tools reutilizables? | [`tools/REGISTRY.md`](tools/REGISTRY.md) · [`docs/03_reference/tools-registry.md`](docs/03_reference/tools-registry.md) (`DOC-REF-007`) |

## Ritual post-clone (primera vez)

```text
/bienvenida  →  /yo  →  trabajar  →  /guardar
```

- **`/bienvenida`** — skill `dt-setup` (modo first-run): checklist markdown, sin Ruby obligatorio
- **`/yo`** — skill `dt-session`: identidad local + roster si nuevo

## Ritual de jornada (obligatorio en equipo)

```text
/actualizar  →  /yo  →  trabajar  →  /guardar
```

- **`/actualizar`** — skill `git-actualizar`: sync `origin` (proyecto) + consulta upstream DT (Fase B, solo aviso); **no** toca `session.yaml`
- **`/yo`** — skill `dt-session`: identidad local + roster si nuevo
- **`/guardar`** — skill `git-guardar`: commit + push **sin** `session.yaml`

**Sin sesión válida** (`vitals/ops/session.yaml` con `operator.id`): **pedí `/yo`** antes de escribir o commitear. La sesión **solo se crea con `/yo`**, no con `/actualizar`.

**`/actualizar`** hace pull del proyecto y consulta si hay versión DT más nueva (ofrece `/actualizar-dt`). No toca `session.yaml` (archivo **local**, no va a Git).

## Commands por grupo

Fuente canónica: **`vitals/config/commands-meta.yaml`**

### Rutina

| Command | Skill |
|---------|--------|
| `/bienvenida` | `dt-setup` (first-run) |
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
| `/verificar` | Números de planillas/reportes con script — skill `data-auditor` |

### Framework

| Command | Notas |
|---------|--------|
| `/setup` | Verificar/reparar drift multi-IDE (skill `dt-setup`, modo repair) |
| `/bootstrap` | Usar El DT como base: promover al raíz + soltar remoto (skill `dt-bootstrap`, irreversible) |
| `/actualizar-dt` | Incorporar release del framework DT desde `dt-upstream` (skill `dt-actualizar`) |
| `/github-save-small` | Skill `github-save-release` (mismas exclusiones que guardar) |

### Diseño (Atelier)

| Command | Skill |
|---------|--------|
| `/atelier` | `atelier` — init, select, detect, polish, audit, … |

Contexto local: `.agents/design-context.md`. Orquestador: **ui-designer**. Implementación: **frontend**.

### Video programático (Remotion)

| Command | Skill |
|---------|--------|
| `/remotion` | `remotion-producer` — composiciones, motion, render |

Orquestador: **remotion-producer**. Best practices: **`remotion-best-practices`** (vendor). Estrategia de video: **marketing-strategist** (`marketing/video`).

## Paridad multi-IDE

IDEs soportados (registro en **`vitals/config/ide-targets.yaml`**): **Cursor, Antigravity, Claude Code, Codex, GitHub Copilot** (stubs: Gemini CLI, Windsurf).

Todo se **genera desde fuentes únicas** — no editar destinos a mano:

- **Reglas:** cuerpo en `vitals/specs/rule-bodies/*.body.md` + metadata en `vitals/config/rules-manifest.yaml` → `./scripts/sync-ide.sh`.
- **Commands:** `vitals/config/commands-meta.yaml` → `./scripts/sync-commands-from-meta.sh`.
- **Skills:** `.cursor/skills/` (canónico) → `./scripts/sync-skills-parity.sh` / `sync-ide.sh`.
- **Catálogo de docs:** derivado → `ruby scripts/sync-catalog.rb`.

**Verificación de orden:** `./scripts/dt-doctor.sh` (debe quedar en verde). El loop de orden continuo (regla `07`) lo aplica de forma autónoma tras cada cambio.

## Reglas siempre activas relevantes

- `00-orquestador-core` — macro pipeline
- `01-protocolos-dt` — no cómplice, alternativas, puntos ciegos
- `02-documentacion` — protocolo `docs/` + tabla "qué cambió → dónde se documenta"
- `07-orden-continuo` — loop autónomo siempre activo (verifica con `dt-doctor`, corrige hasta verde)
- `06-dt-colaboracion` — sesión, zonas, `_meta` en pulse
- `05-multi-project-git` — si existe `vitals/workspace.yaml`
- `08-stack-web-default` — stack Firebase + Node (soft default)
- `15-engineering-reuse` — discover before create, jerarquía de reutilización
- `16-numeric-grounding` — números solo con script ejecutado; etiquetas de procedencia

Precedencia: `vitals/specs/precedence.md`

## Subagentes (22)

Tabla maestra con agente, skill de rol y keywords: **[README — Subagentes (22)](README.md#catálogo-de-los-22-especialistas)**. Reglas de delegación: `.cursor/rules/03-catalogo-subagentes.mdc`.

| Grupo | Subagentes |
|-------|------------|
| Engineering | arquitecto, frontend, devops, ui-designer, **remotion-producer** |
| Planning | prd-creator, srd-creator, development-planner |
| Testing | qa, **data-auditor** (números verificados — regla `16-numeric-grounding`, `/verificar`) |
| Design & UX | ux-researcher |
| Product | product-strategist, feedback-synthesizer, researcher |
| Documentation | doc |
| Marketing & Content | content-creator, **marketing-strategist** (+42 tácticas), brand-guardian, growth-hacker, pitch-specialist, storytelling-specialist |
| Operations | operations-maintainer |

**Marketing táctico:** `.cursor/skills/marketing/` · contexto `.agents/product-marketing.md` (local).

**Atelier (diseño):** `.cursor/skills/design/` · `/atelier` · contexto `.agents/design-context.md` (local) · docs `DOC-DESIGN-001`.

**Remotion (video):** [`tools/remotion/`](tools/remotion/) · `.cursor/skills/remotion-best-practices/` · `/remotion` · orquestador **remotion-producer**.

## Versión del template

`VERSION` en la raíz (semver del framework).
