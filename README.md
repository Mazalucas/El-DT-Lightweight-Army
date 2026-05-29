![El DT — Technical Director: orchestrator core, 8-step workflow, and subagents](assets/el-dt-readme-banner.png)

# El DT — Technical Director

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
**v1.6.3**

> Stop settling for an assistant that **only ships**. El DT is the framework that turns your AI into a **Technical Director**: it structures the conversation, **challenges you before production changes**, offers **alternatives with trade-offs**, and closes with **visible risks**.

**Multi-IDE:** Cursor and Antigravity — [docs/02_guides/ide-setup.md](docs/02_guides/ide-setup.md) (`DOC-GUIDE-001`).

---

## Cerebro del equipo — empezá acá

Este repo es **memoria versionada + reglas** para que varias personas trabajen con la misma IA sin pisarse. La referencia técnica completa está en **[docs/00_overview/cerebro-equipo-mecanismos-dt.md](docs/00_overview/cerebro-equipo-mecanismos-dt.md)** (`DOC-OV-004`). La IA debe leer **[AGENTS.md](AGENTS.md)** al entrar al proyecto.

### Ritual diario (regla de oro)

```text
/actualizar  →  /yo  →  trabajar  →  /guardar
```

| Paso | Qué hace |
|------|----------|
| **`/actualizar`** | Baja cambios del equipo (`git pull --rebase`); **no** toca tu sesión local |
| **`/yo`** | Decís quién sos hoy — la laptop no lo adivina |
| **Trabajar** | `/orquestar`, `/fast-lane`, código, docs, pulse… |
| **`/guardar`** | Subís a GitHub **sin** subir `session.yaml` ni secretos |

Si **no tenés sesión** (`vitals/ops/session.yaml`), la IA te pedirá **`/yo`** antes de escribir en el repo. La sesión **solo se crea con `/yo`** (no copies archivos a mano).

### Primera vez en esta máquina

```bash
git clone <este-repo>
cd El-DT-Lightweight-Army
```

En el chat: **`/actualizar`** → **`/yo`** (ej. *"Soy Ana García, analista"*) — opcional **`/setup-cursor`** o **`/setup-antigravity`** si querés un solo IDE.

### Git: qué va y qué no va al remoto

| Path | ¿En Git? | Por qué |
|------|----------|---------|
| `vitals/ops/session.yaml` | **No** | Quién está en **esta** PC ahora |
| `vitals/config/roster.yaml` | **Sí** | Equipo registrado |
| `vitals/workspace.yaml` | **No** | Multi-repo local (plantilla: `.example`) |
| `.env`, `*.credentials` | **No** | Secretos |
| `.cursor/`, `.agent/`, `.agents/README.md`, `docs/`, skills | **Sí** | Comportamiento de la IA |
| `.agents/product-marketing.md` | **No** | Contexto de producto local |

### Commands (resumen)

Fuente canónica de taglines y grupos: **[vitals/config/commands-meta.yaml](vitals/config/commands-meta.yaml)**

| Grupo | Commands |
|-------|----------|
| **Rutina** | `/actualizar` · `/yo` · `/guardar` |
| **Trabajo** | `/orquestar` · `/fast-lane` · `/cuestionar` · `/contexto` · `/prepr` |
| **Framework** | `/setup-cursor` · `/setup-antigravity` · `/github-save-small` |

En **Antigravity**, los de rutina están en [`.agent/workflows/`](.agent/workflows/) (`actualizar`, `yo`, `guardar`); la lógica vive en [`.agent/skills/`](.agent/skills/) (ver [.antigravity/rules.md](.antigravity/rules.md)).

### Tarjeta pegable al monitor

```text
  actualizar → yo → trabajar → guardar
  session.yaml = solo en tu PC
```

---

## Quick setup (English)

1. **Clone** this repo (or **Use this template** on GitHub).
2. **IDE setup** in chat: `/setup-cursor` or `/setup-antigravity` — see [ide-setup.md](docs/02_guides/ide-setup.md).
3. **Daily ritual:** `/actualizar` → `/yo` (si no hay sesión; la IA también lo pide) → work → `/guardar`
5. **Deep work:** `/orquestar` (full pipeline) or `/fast-lane` (closed scope)

Adopting El DT in an existing repo: [adopt-dt-in-existing-repo.md](docs/02_guides/adopt-dt-in-existing-repo.md) (`DOC-GUIDE-003`).

---

## Why it exists

Models default to agreeableness. **El DT flips that:** clarity and validation first, execution second — **protocols**, **precedence** ([vitals/specs/precedence.md](vitals/specs/precedence.md)), and **Vitals** (pulse, opt-in memory, specs) without replacing your product `docs/`.

---

## The five protocols

Detail: [`.cursor/rules/01-protocolos-dt.mdc`](.cursor/rules/01-protocolos-dt.mdc)

1. **No enabler** — Validate before high-impact actions.
2. **Alternatives** — Multiple paths with trade-offs.
3. **Blind spots** — Risks and reviewer flags on delivery.
4. **Conversational** — Dialogue, not one-way reports.
5. **Order** — Goal → Plan → Execution → Validation.

---

## Macro vs micro

**Macro:** Clarify → Plan and validate → Execute → Deliver ([`00-orquestador-core`](.cursor/rules/00-orquestador-core.mdc)).

**Micro:** `/orquestar` = 8 steps (clarify … documentation closure).

```mermaid
flowchart LR
  req[Request]
  clarify[Clarify]
  gate{FastLane_or_validate}
  planExec[Plan_and_execute]
  deliver[Deliver]
  req --> clarify --> gate --> planExec --> deliver
```

Security and secrets **always** apply, including under `/fast-lane`.

---

## Vitals

| Layer | Path |
|-------|------|
| Index | [vitals/INDEX.md](vitals/INDEX.md) |
| Session (local) | `vitals/ops/session.yaml` |
| Team roster | `vitals/config/roster.yaml` |
| Commands meta | `vitals/config/commands-meta.yaml` |
| Concept doc | [docs/01_concepts/dt-vitals.md](docs/01_concepts/dt-vitals.md) |

| Script | Uso |
|--------|-----|
| [sync-dt-from-vitals.sh](scripts/sync-dt-from-vitals.sh) | Rules `04`–`05` desde `vitals/specs/rule-bodies/` |
| [sync-commands-from-meta.sh](scripts/sync-commands-from-meta.sh) | Commands en Cursor + Antigravity desde `commands-meta.yaml` |
| [sync-skills-parity.sh](scripts/sync-skills-parity.sh) | Skills `.cursor/skills` → `.agent/skills` (incl. árbol `marketing/*`) |

Detalle: [scripts/README.md](scripts/README.md).

---

## Subagentes (20)

El DT delega en **20 especialistas**. Cada uno tiene definición de agente en **Cursor** y skill de rol en **Antigravity** (y espejo en `.agent/skills/` para todos).

| IDE | Definición del subagente | Skill de rol | Skills tácticas extra |
|-----|--------------------------|--------------|------------------------|
| **Cursor** | [`.cursor/agents/{nombre}.md`](.cursor/agents/) | [`.cursor/skills/{nombre}/`](.cursor/skills/) cuando existe | Solo **marketing-strategist**: [`.cursor/skills/marketing/`](.cursor/skills/marketing/) |
| **Antigravity** | Misma skill de rol | [`.agent/skills/{nombre}/SKILL.md`](.agent/skills/) | [`.agent/skills/marketing/`](.agent/skills/marketing/) |

Tras editar skills en Cursor: `./scripts/sync-skills-parity.sh`. Reglas de delegación: [`.cursor/rules/03-catalogo-subagentes.mdc`](.cursor/rules/03-catalogo-subagentes.mdc).

### Catálogo de los 20 subagentes

| # | Subagente | Grupo | Rol | Invocar cuando (keywords) | Agente (Cursor) | Skill de rol |
|---|-----------|-------|-----|---------------------------|-----------------|--------------|
| 1 | **arquitecto** | Engineering | Backend, APIs, arquitectura, patrones | `backend`, `api`, `database`, `server`, `arquitectura`, `SRD` | [agente](.cursor/agents/arquitecto.md) | [`.agent/skills/arquitecto/`](.agent/skills/arquitecto/) |
| 2 | **frontend** | Engineering | UI, componentes, accesibilidad | `frontend`, `ui`, `ux`, `interface`, `client`, `componentes` | [agente](.cursor/agents/frontend.md) | [`.agent/skills/frontend/`](.agent/skills/frontend/) |
| 3 | **devops** | Engineering | CI/CD, infra, deploy | `deploy`, `infrastructure`, `ci/cd`, `devops`, `pipelines` | [agente](.cursor/agents/devops.md) | [`.agent/skills/devops/`](.agent/skills/devops/) |
| 4 | **ui-designer** | Engineering | Mockups, design systems, specs UI | `UI design`, `mockups`, `design specs`, `design systems` | [agente](.cursor/agents/ui-designer.md) | [`.agent/skills/ui-designer/`](.agent/skills/ui-designer/) |
| 5 | **prd-creator** | Planning | PRD, visión de producto, user stories | `product idea`, `requirements`, `PRD` | [agente](.cursor/agents/prd-creator.md) | [`.agent/skills/prd-creator/`](.agent/skills/prd-creator/) |
| 6 | **srd-creator** | Planning | SRD y specs técnicas desde PRD | `technical spec`, `SRD`, `PRD to technical` | [agente](.cursor/agents/srd-creator.md) | [`.agent/skills/srd-creator/`](.agent/skills/srd-creator/) |
| 7 | **development-planner** | Planning | Fases, MVP, roadmap, timelines | `development plan`, `phases`, `MVP`, `roadmap` | [agente](.cursor/agents/development-planner.md) | [`.agent/skills/development-planner/`](.agent/skills/development-planner/) |
| 8 | **qa** | Testing | Tests, edge cases, validación | `test`, `qa`, `quality`, `pruebas` | [agente](.cursor/agents/qa.md) | [`.agent/skills/qa/`](.agent/skills/qa/) |
| 9 | **ux-researcher** | Design & UX | Personas, journey, research UX | `user research`, `personas`, `UX`, `journey mapping` | [agente](.cursor/agents/ux-researcher.md) | [`.agent/skills/ux-researcher/`](.agent/skills/ux-researcher/) |
| 10 | **product-strategist** | Product | Priorización, roadmap de producto | `prioritization`, `roadmap`, `product strategy` | [agente](.cursor/agents/product-strategist.md) | [`.agent/skills/product-strategist/`](.agent/skills/product-strategist/) |
| 11 | **feedback-synthesizer** | Product | Síntesis de feedback en insights | `feedback`, `synthesis`, `insights` | [agente](.cursor/agents/feedback-synthesizer.md) | [`.agent/skills/feedback-synthesizer/`](.agent/skills/feedback-synthesizer/) |
| 12 | **researcher** | Product | Investigación y análisis de información | `research`, `analyze`, `investigate` | [agente](.cursor/agents/researcher.md) | [`.agent/skills/researcher/`](.agent/skills/researcher/) |
| 13 | **doc** | Documentation | Docs por niveles, README, ADRs | `document`, `docs`, `readme`, `documentación` | [agente](.cursor/agents/doc.md) | [`.agent/skills/doc/`](.agent/skills/doc/) |
| 14 | **content-creator** | Marketing & Content | Contenido multi-canal, SEO, brand | `content`, `copy` (contenido editorial) | [agente](.cursor/agents/content-creator.md) | [`.agent/skills/content-creator/`](.agent/skills/content-creator/) |
| 15 | **marketing-strategist** | Marketing & Content | Estrategia + **42 skills tácticas** | `marketing`, `CRO`, `SEO`, `ads`, `campaigns`, `growth` | [agente](.cursor/agents/marketing-strategist.md) | [`.cursor/skills/marketing-strategist/`](.cursor/skills/marketing-strategist/) + [tácticas ↓](#marketing-strategist--42-skills-tácticas) |
| 16 | **brand-guardian** | Marketing & Content | Marca y brand guidelines | `brand`, `brand compliance` | [agente](.cursor/agents/brand-guardian.md) | [`.agent/skills/brand-guardian/`](.agent/skills/brand-guardian/) |
| 17 | **growth-hacker** | Marketing & Content | Experimentos y conversión | `growth`, `experiments`, `conversion` | [agente](.cursor/agents/growth-hacker.md) | [`.agent/skills/growth-hacker/`](.agent/skills/growth-hacker/) |
| 18 | **pitch-specialist** | Marketing & Content | Pitch inversores y stakeholders | `pitch`, `presentation`, `investors` | [agente](.cursor/agents/pitch-specialist.md) | [`.agent/skills/pitch-specialist/`](.agent/skills/pitch-specialist/) |
| 19 | **storytelling-specialist** | Marketing & Content | Narrativa y story arcs | `storytelling`, `narrative`, `story` | [agente](.cursor/agents/storytelling-specialist.md) | [`.agent/skills/storytelling-specialist/`](.agent/skills/storytelling-specialist/) |
| 20 | **operations-maintainer** | Operations | Monitoreo, incidentes, mantenimiento | `operations`, `monitoring`, `incidentes` | [agente](.cursor/agents/operations-maintainer.md) | [`.agent/skills/operations-maintainer/`](.agent/skills/operations-maintainer/) |

**Skills de rutina DT** (no son subagentes): `dt-session`, `git-actualizar`, `git-guardar`, `github-save-release` en [`.cursor/skills/`](.cursor/skills/) — comandos `/yo`, `/actualizar`, `/guardar`, `/github-save-small`.

### Marketing strategist — 42 skills tácticas

Único subagente con **pack de skills especializadas** (origen: [marketingskills](https://github.com/coreyhaines31/marketingskills) v2). Contexto compartido: `.agents/product-marketing.md` (local; skill `product-marketing`).

| IDE | Orquestadora | Pack táctico (`SKILL.md` + `references/` + `evals/`) |
|-----|--------------|------------------------------------------------------|
| **Cursor** | [`.cursor/skills/marketing-strategist/`](.cursor/skills/marketing-strategist/) | [`.cursor/skills/marketing/{skill}/`](.cursor/skills/marketing/) |
| **Antigravity** | [`.agent/skills/marketing-strategist/`](.agent/skills/marketing-strategist/) | [`.agent/skills/marketing/{skill}/`](.agent/skills/marketing/) |

Índice: [`.cursor/skills/marketing/README.md`](.cursor/skills/marketing/README.md)

| Skill | Área |
|-------|------|
| `product-marketing` | Contexto de producto (base para todas) |
| `ab-testing` | Experimentación y A/B tests |
| `ad-creative` | Creatividades de ads |
| `ads` | Campañas pagadas (Google, Meta, LinkedIn, etc.) |
| `ai-seo` | SEO para motores / respuestas IA |
| `analytics` | Medición, GA4, tracking |
| `aso` | App Store / Google Play |
| `churn-prevention` | Retención, dunning, cancel flows |
| `co-marketing` | Partnerships y campañas conjuntas |
| `cold-email` | Outbound B2B |
| `community-marketing` | Comunidades y advocacy |
| `competitor-profiling` | Research de competidores (URLs) |
| `competitors` | Páginas comparison / alternatives |
| `content-strategy` | Estrategia de contenido |
| `copy-editing` | Editar copy existente |
| `copywriting` | Copy nuevo (landings, web) |
| `cro` | Conversión en páginas y forms |
| `customer-research` | Research de clientes |
| `directory-submissions` | Directorios startup/SaaS |
| `emails` | Secuencias y lifecycle email |
| `free-tools` | Herramientas gratis como lead gen |
| `image` | Imágenes de marketing (IA) |
| `launch` | Lanzamientos |
| `lead-magnets` | Lead magnets |
| `marketing-ideas` | Ideas e inspiración |
| `marketing-psychology` | Psicología y persuasión |
| `onboarding` | Activación post-signup |
| `paywalls` | Paywalls in-app |
| `popups` | Modales y overlays |
| `pricing` | Pricing y packaging |
| `programmatic-seo` | SEO programático |
| `prospecting` | Listas y calificación B2B |
| `referrals` | Referidos y afiliados |
| `revops` | RevOps y handoff marketing→ventas |
| `sales-enablement` | Collateral de ventas |
| `schema` | Schema markup |
| `seo-audit` | Auditoría SEO |
| `signup` | Flujos de registro |
| `site-architecture` | Arquitectura del sitio |
| `sms` | SMS/MMS marketing |
| `social` | Redes sociales |
| `video` | Video marketing (IA) |

---

## Project layout

```text
README.md / AGENTS.md / VERSION
.agents/                    # README + product-marketing.md (local)
docs/                       # Portal DOC-META-001 — cerebro DOC-OV-004
vitals/
  config/                   # commands-meta.yaml, roster.yaml
  ops/                      # README schema; session.yaml = local (/yo)
  pulse/ memory/ specs/
  work/inbox/{operator_id}/ # cuaderno personal opcional

.cursor/                    # rules, commands, agents, skills (+ marketing/)
.agent/                     # Antigravity: rules, workflows, skills (+ marketing/)
```

---

## Customize

- **Rules:** `.cursor/rules/` for your stack.
- **Commands:** edit `vitals/config/commands-meta.yaml` first, then `.cursor/commands/` and `.agent/workflows/`.
- **Multi-project:** `vitals/workspace.yaml` from [workspace.yaml.example](vitals/workspace.yaml.example).

---

## Documentation portal

[docs/README.md](docs/README.md) (`DOC-OV-001`) · Protocol: [docs/99_meta/protocolo-documentacion-ia.md](docs/99_meta/protocolo-documentacion-ia.md)

---

## License

MIT — see [LICENSE](LICENSE). Attribution: **@LucasMazalan** · [GitHub: Mazalucas](https://github.com/Mazalucas).
