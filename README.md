![El DT — Technical Director: orchestrator core, 8-step workflow, and subagents](assets/el-dt-readme-banner.png)

# El DT — Director de proyecto con IA

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
**v1.8.0**

*Tu IA con equipo, criterio y herramientas — no un chat que dice “sí” a todo.*

**El DT** es un Director de Proyecto para tu IA: no solo ejecuta — **organiza el trabajo**, **te hace preguntas antes de avanzar**, **propone alternativas** y **te avisa de riesgos** antes de cerrar.

Delega en **23 especialistas** (producto, diseño, marketing, documentación, calidad, seguridad…) y trae herramientas listas para:

- **Páginas web y productos digitales** — landings, dashboards, pantallas de login ([Atelier](#atelier--diseño-web-y-presentaciones))
- **Presentaciones y pitches** — decks, slides, material para inversores ([Atelier](#atelier--diseño-web-y-presentaciones))
- **Videos** — demo del producto, clip para compartir, HTML o asset React ([carriles](#video))
- **Marketing** — copy, SEO, campañas, lanzamientos ([42 skills tácticas](#marketing--42-skills-tácticas))

Todo desde el chat de tu editor (**Cursor**, **Antigravity**, **Claude Code** y más). **Empezá en 2 minutos:** [`/bienvenida`](#primera-vez) → [`/yo`](#ritual-del-día).

> **El DT no es un prompt:** es un cerebro operativo con ~1.400 documentos canónicos, ~56.000 líneas de orquestación, 23 especialistas, 105 skills y un ecosistema de diseño/marketing/video que suma cientos de miles de líneas de plantillas listas para usar.

---

## Índice

- [Qué trae v1.8.0](#que-trae)
- [Empezá acá](#empezá-acá)
- [Ritual del día](#ritual-del-día)
- [Qué puede hacer El DT](#qué-puede-hacer-el-dt)
- [Comandos principales](#comandos-principales)
- [Google Drive — `/drive`](#google-drive--drive)
- [Ordenar · Hack · Atelier · Video · Marketing](#ordenar--captura-de-conocimiento)
- [Quick setup (English)](#quick-setup-english)
- [Para el equipo técnico](#para-el-equipo-técnico)

---

## Qué trae v1.8.0 {#que-trae}

Capacidad nueva sobre **v1.7.11**. El uso anterior sigue igual.

| Tema | Qué cambia |
|------|------------|
| **Publicar el DT** | `/oficial` marca esta carpeta como el único checkout que puede pushear al remoto oficial. `/guardar` corre el gate antes del bump e instala un `pre-push`. Sesión, inbox, postura y perfil de `/dt-config` quedan en la máquina. En ese remoto, `roster.yaml` viaja con `team: []` y el commit no lleva operador. |
| **Cuánto contexto** | `/dt-config` elige qué reglas extra entran en cada mensaje (Recomendado, Docs, Código, Web, Números). El perfil queda en esta PC y no pide `/yo`. Las cuatro reglas fijas siguen siempre activas. |
| **Video** | [`tools/video/ROUTING.md`](tools/video/ROUTING.md) elige el carril: `/recordly` (demo del producto corriendo), `/brag` (clip de 15–25 s para compartir), Hyperframes (composición HTML a medida) o `/remotion` (asset React que se mantiene, con props, lote o Lambda). Recordly y brag se instalan en caché local; el fuente no entra al repo. |
| **Validar un plan** | `/analisis-propuesta` convoca un panel de modelos distintos al autor, en dos rondas, y se queda en el diagnóstico. Referencia: [analisis-propuesta.md](docs/03_reference/analisis-propuesta.md) (`DOC-REF-011`). |
| **Postura** | `/yo` deja el trabajo en `personal` o `team`. En el checkout oficial esa postura vive en `vitals/ops/collaboration.local.yaml` y `/yo` no agrega personas a `roster.yaml`. |
| **Atelier** | El router carga el context adapter de Impeccable y su playbook (`shape`, `live`, `critique`, `audit`, `polish` y el resto). La superficie se nombra Persuade, Operate, Read o Experience. Siguen `/atelier select`, tokens, templates y decks del pack DT. |

Skills de esta entrega: `dt-oficial`, `dt-config`, `video-routing`, `recordly`, `brag`, `analisis-propuesta`. Specs: [canonical-publish.md](vitals/specs/canonical-publish.md) · [tools/REGISTRY.md](tools/REGISTRY.md).

---

## Empezá acá

| Si querés… | Hacé esto |
|------------|-----------|
| Usar El DT por primera vez | `/bienvenida` → `/yo` |
| Trabajar en el día a día | `/actualizar` → `/yo` → trabajar → `/guardar` |
| Una tarea grande, paso a paso | `/orquestar` |
| Algo puntual ya definido | `/fast-lane` |
| Diseñar una web, dashboard o presentación | `/atelier` |
| Crear un video | Leé [`tools/video/ROUTING.md`](tools/video/ROUTING.md): `/recordly`, `/brag`, Hyperframes o `/remotion` |
| Consultar documentos en Google Drive | `/drive` (opcional — ver [abajo](#google-drive--drive)) |
| Volcar briefs, notas o dumps al cerebro del repo | `/ordenar` |
| Auditar seguridad del proyecto (auth, API, secrets…) | `/hack` |
| Afinar qué reglas carga la IA en cada mensaje | `/dt-config` |
| Validar un plan ya escrito, sin ejecutarlo | `/analisis-propuesta` |
| Ver el equipo completo de especialistas | [Catálogo de 23](#catálogo-de-los-23-especialistas) |

Este repo es **memoria compartida + reglas** para que varias personas trabajen con la misma IA sin pisarse. Guía humana: [cerebro del equipo](docs/00_overview/cerebro-equipo-mecanismos-dt.md). La IA lee **[AGENTS.md](AGENTS.md)** al entrar al proyecto.

### Primera vez {#primera-vez}

```bash
git clone <este-repo>
cd El-DT-Lightweight-Army
```

En el chat: **`/bienvenida`** → **`/yo`** (ej. *"Soy Ana García, analista"*). Guía detallada: [primer-setup-dt.md](docs/02_guides/primer-setup-dt.md).

No hace falta `/actualizar` en un clone recién hecho — usalo cuando el remoto del producto o del template tenga novedades.

---

## Ritual del día {#ritual-del-día}

```text
/actualizar  →  /yo  →  trabajar  →  /guardar
```

| Paso | Qué hace |
|------|----------|
| **`/actualizar`** | Sincronizar tu proyecto (`origin`) y avisar si hay release nuevo del framework DT |
| **`/yo`** | Decir quién sos en esta computadora |
| **Trabajar** | Pedir lo que necesites (`/orquestar`, diseño, video, docs…) |
| **`/guardar`** | Guardar tu trabajo — bump, sync y tag. Publica en el remoto de este proyecto; el repo oficial del DT solo si el dueño activó esta carpeta con `/oficial` |
| **`/drive`** | Conectar Google Drive y elegir carpetas como contexto del cerebro (opcional) |

Si la IA no sabe quién sos, te pedirá **`/yo`** antes de escribir en el repo. Tu identidad en esta PC **no se sube a GitHub** — es privada.

### Tarjeta pegable al monitor

```text
  bienvenida → yo → trabajar → guardar
  actualizar = proyecto + aviso si hay DT nuevo
  actualizar-dt = cuando quieras incorporar el framework
  drive = Google Drive (carpetas que elijas, solo en tu PC)
  dt-config = cuánto contexto del DT, solo en esta PC
  tu identidad en esta PC = solo local
```

---

## Qué puede hacer El DT

| Bloque | En pocas palabras |
|--------|-------------------|
| **Orquestación** | Clarifica qué querés, planifica, ejecuta y cierra señalando riesgos. Comando principal: `/orquestar`. |
| **23 especialistas** | Producto, diseño, marketing, documentación, calidad, seguridad… El DT elige quién ayuda según tu pedido. |
| **Atelier (diseño)** | Landings, dashboards, login, presentaciones — con criterio estético y guardrails anti-“diseño genérico de IA”. |
| **Captura de conocimiento** | Volcar archivos, carpetas y dumps del chat — clasificar, documentar en la capa correcta y dejar manifest recuperable (`/ordenar`). |
| **Seguridad** | Auditoría ofensiva-defensiva del propio repo — auth, API, secrets, agentes/IA (`/hack` → subagente **hack-audit**). |
| **Videos** | Carril según el pedido: `/recordly`, `/brag`, Hyperframes o `/remotion`. Matriz en [`tools/video/ROUTING.md`](tools/video/ROUTING.md). |
| **Marketing** | Copy, SEO, lanzamientos y campañas — 42 skills tácticas. |

```mermaid
flowchart TB
  vos[Vos en el chat]
  dt[El DT — orquestador]
  esp[23 especialistas]
  atelier[Atelier — webs y presentaciones]
  video[Videos — cuatro carriles]
  mkt[Marketing — 42 skills]
  vos --> dt
  dt --> esp
  esp --> atelier
  esp --> video
  esp --> mkt
```

### Los cinco protocolos

El DT no es un ejecutor pasivo. Siempre aplica:

1. **Validar antes de actuar** — te pregunta antes de cambios importantes.
2. **Alternativas** — propone caminos con pros y contras.
3. **Puntos ciegos** — riesgos y mejoras visibles al cerrar.
4. **Conversacional** — diálogo, no informe unidireccional.
5. **Orden** — objetivo → plan → ejecución → validación.

Detalle: [protocolos DT](.cursor/rules/01-protocolos-dt.mdc).

---

## Comandos principales

| Comando | Para qué sirve |
|---------|----------------|
| **`/bienvenida`** | Primera vez — verificar que El DT está listo |
| **`/actualizar`** | Sincronizar tu proyecto y avisar si hay DT nuevo |
| **`/actualizar-dt`** | Incorporar release del framework DT (cuando /actualizar avise) |
| **`/yo`** | Decir quién sos en esta máquina |
| **`/guardar`** | Guardar tu trabajo — la IA elige el bump, sync README/paquetes, tag `vX.Y.Z`. El repo oficial del DT solo con `/oficial` |
| **`/bootstrap`** | Usar este clone como base de tu proyecto y soltar el remoto del DT |
| **`/oficial`** | El dueño marca esta carpeta como el único checkout que publica al DT |
| **`/drive`** | Conectar Google Drive y registrar carpetas para que la IA las consulte |
| **`/dt-config`** | Elegir qué reglas van en cada mensaje. El perfil queda en esta PC |
| **`/orquestar`** | Tarea grande — pipeline completo en 8 pasos |
| **`/fast-lane`** | Algo puntual ya definido — menos preguntas rutinarias |
| **`/cuestionar`** | Solo análisis — sin ejecutar |
| **`/analisis-propuesta`** | Panel multi-modelo sobre un plan ya escrito — dos rondas, solo diagnóstico (skill `analisis-propuesta`) |
| **`/contexto`** | Mapa del repo cuando entrás o después de un pull grande |
| **`/ordenar`** | Volcar archivos y data — documentar en la capa correcta + manifest (skill `dt-ordenar`) |
| **`/hack`** | Auditoría de seguridad — mentalidad de atacante, entrega defensiva (skill `hack-audit` → subagente **hack-audit**) |
| **`/verificar`** | Verificar números de planillas y reportes con script (skill `data-auditor` → subagente **data-auditor**) |
| **`/prepr`** | Preparar cambios como pull request |
| **`/atelier`** | Diseñar webs, dashboards o presentaciones |
| **`/remotion`** | Asset de video en React (plantilla, props, lote) |
| **`/recordly`** | Demo del producto corriendo; el binario de Recordly queda fuera del git |
| **`/brag`** | Clip de lanzamiento de 15–25 s; la skill upstream queda en caché local |
| **`/setup`** | Reparar configuración del editor tras un pull grande |

Grupos completos y taglines: [commands-meta.yaml](vitals/config/commands-meta.yaml).

---

## Google Drive — `/drive` {#google-drive--drive}

Integración **opcional**: conectá **solo las carpetas que elijas** de Google Drive para que el DT las use como contexto al responder (briefs, reportes, docs de cliente). **No movés archivos al repo** y **nada de Drive se sube a GitHub** — credenciales, tokens y la lista de carpetas viven solo en tu máquina.

### Para qué sirve

| Situación | Qué hace `/drive` |
|-----------|-------------------|
| Primera vez | OAuth con tu cuenta Google, registra el MCP en Cursor/Antigravity, elegís carpetas |
| Ya conectado | Cambiar qué carpetas compartís al cerebro o revisar la config local |
| En el chat | La IA lee Docs/Sheets/Slides/PDF de esas carpetas vía MCP cuando el pedido lo amerita |

### Cómo usarlo

1. **`/yo`** — identidad local (requisito del DT).
2. **`/drive`** — el DT te guía paso a paso:
   - Pedí el archivo **`dt-drive-credentials.json`** al canal interno de tu empresa (nunca va al repo).
   - Corre **`./scripts/setup-drive.sh`** (o dejá que la IA lo ejecute) y reiniciá el IDE si hace falta.
   - Elegí **Shared Drives** o carpetas de “Mi unidad” y describí en una frase qué contiene cada una.
3. **Trabajá normal** — pedí en lenguaje natural: *“según el brief en Drive…”*, *“resume el doc de la carpeta X”*.

La selección queda en **`vitals/config/drive-context.yaml`** (local, no Git). Alcance de lectura: **solo lectura** (`drive.readonly`).

**Guía completa:** [drive-cerebro-setup.md](docs/02_guides/drive-cerebro-setup.md) · **Admin GCP:** [drive-google-cloud-admin.md](docs/06_operations/drive-google-cloud-admin.md)

---

## Ordenar — captura de conocimiento {#ordenar--captura-de-conocimiento}

**`/ordenar`** ingesta archivos, carpetas y dumps del chat, los clasifica por capa (`docs/`, `vitals/work/knowledge/`, inbox personal…) y deja un **manifest** recuperable para que la IA no pierda contexto.

| Comando | Ejemplo |
|---------|---------|
| `/ordenar` | Pipeline completo — inventario, plan de archivo, documentación, indexación |
| `/ordenar quick` | Plan + máx. 3 docs canónicos; el resto en `sources/` |
| `/ordenar inbox` | Solo cuaderno personal (`vitals/work/inbox/{id}/`) |
| `/ordenar docs` | Forzar promoción a `docs/` con frontmatter |

Flujo típico: skill **`dt-ordenar`** orquesta la ingesta; redacción pesada → delegar en **doc**.

- Skill: [`.cursor/skills/dt-ordenar/`](.cursor/skills/dt-ordenar/)
- Guía: [ordenar-captura-conocimiento.md](docs/02_guides/ordenar-captura-conocimiento.md) (`DOC-GUIDE-016`)
- Paquetes de sesión: [`vitals/work/knowledge/`](vitals/work/knowledge/)

---

## Hack — auditoría de seguridad {#hack--auditoría-de-seguridad}

**`/hack`** audita el propio proyecto con mentalidad de atacante y entrega **defensiva**: hallazgos con severidad (SEV), prioridad y remediación anclada al repo — sin exploits ni PoCs.

| Comando | Ejemplo |
|---------|---------|
| `/hack` | Full repo — los 9 dominios (auth, API, secrets, frontend, infra, agents…) |
| `/hack auth` · `/hack api` · `/hack agents` | Un dominio |
| `/hack diff` | Cambios vs base (`git diff`) con contexto de superficie |

Flujo típico: skill **`hack-audit`** → subagente **`hack-audit`** (evidencia con `tools/security/scan-repo.sh` antes del juicio manual).

- Skill: [`.cursor/skills/hack-audit/`](.cursor/skills/hack-audit/)
- Subagente: [`.cursor/agents/hack-audit.md`](.cursor/agents/hack-audit.md)
- Referencia: [hack-audit-default.md](docs/03_reference/hack-audit-default.md) (`DOC-REF-010`)
- Informes locales (gitignored): [`vitals/work/audits/`](vitals/work/audits/)
- Scanners: [`tools/security/`](tools/security/)

---

## Atelier — diseño web y presentaciones

**Atelier** es la capacidad de diseño de El DT: landings, dashboards, flujos de login, pitches y decks — con selección de design system, tokens y revisión anti-slop.

| Comando | Ejemplo |
|---------|---------|
| `/atelier init` | Crear contexto de diseño del proyecto |
| `/atelier select [brief]` | Elegir estilo y sistema según tu pedido |
| `/atelier detect [path]` | Detectar patrones genéricos de IA en el código |
| `/atelier polish [target]` | Pasada final antes de entregar |

Incluye **6 design systems** (Material, Apple HIG, Fluent, Carbon, Polaris, Atlassian), **5 lenguajes visuales** (Swiss, Bauhaus, minimalismo, neumorphism, glass) y biblioteca de plantillas.

- Concepto: [Atelier en El DT](docs/01_concepts/design-atelier-el-dt.md)
- Índice de skills: [.cursor/skills/design/README.md](.cursor/skills/design/README.md)
- Plantillas: [.cursor/skills/design/templates/INDEX.md](.cursor/skills/design/templates/INDEX.md)

Orquestador: **ui-designer** · Implementación en código: **frontend**.

---

## Video

El DT elige el carril en [`tools/video/ROUTING.md`](tools/video/ROUTING.md). Hyperframes no es el motor por defecto.

| Carril | Command | Cuándo |
|--------|---------|--------|
| Grabación del producto corriendo | `/recordly` | Clics, cursor, walkthrough, GIF. El binario oficial va a `output/.cache/recordly/` |
| Clip de lanzamiento, 15–25 s, para compartir | `/brag` | El sujeto es este proyecto. La skill upstream se instala en `output/.cache/brag/` (gitignored) |
| Composición HTML a medida | `npx hyperframes` | Explainer, PR, slideshow, captions, motion corto, pieza de más de 25 s |
| Asset React que se mantiene | `/remotion` | Plantilla, props, lote, 3D, Lambda |

Flujo: **marketing-strategist** lee la matriz y deriva. Carril Remotion → **remotion-producer**.

- Matriz: [tools/video/ROUTING.md](tools/video/ROUTING.md)
- Remotion: [tools/remotion/](tools/remotion/)

---

## Marketing — 42 skills tácticas

**marketing-strategist** coordina **42 skills especializadas**: copy, SEO, ads, lanzamientos, email, pricing, CRO y más.

- Índice completo: [.cursor/skills/marketing/README.md](.cursor/skills/marketing/README.md)
- Contexto de producto (local): `.agents/product-marketing.md`

[Ver listado completo de skills ↓](#marketing-strategist--42-skills-tácticas)

---

## Quick setup (English)

1. **Clone** this repo (or **Use this template** on GitHub).
2. In chat: **`/bienvenida`** then **`/yo`** — see [primer-setup-dt.md](docs/02_guides/primer-setup-dt.md).
3. **Daily ritual:** `/actualizar` → `/yo` → work → `/guardar` (pushes to this checkout's remote; the official DT repo only after the owner runs `/oficial` here. A new project starts with `/bootstrap`)
4. **Design:** `/atelier` · **Video:** [`tools/video/ROUTING.md`](tools/video/ROUTING.md) (`/recordly`, `/brag` o `/remotion`) · **Knowledge:** `/ordenar` · **Security:** `/hack` · **Deep work:** `/orquestar` or `/fast-lane`
5. **Repair IDE drift:** `/setup` — see [ide-setup.md](docs/02_guides/ide-setup.md)

Adopting El DT in an existing repo: [adopt-dt-in-existing-repo.md](docs/02_guides/adopt-dt-in-existing-repo.md).

Works in **Cursor**, **Antigravity**, **Claude Code**, **Codex** and **GitHub Copilot**.

---

## Para el equipo técnico

### El DT mantiene el proyecto ordenado

Tras cambios importantes en documentación, reglas o estructura, El DT verifica que todo siga coherente (frontmatter, catálogo, enlaces, paridad entre editores). Motor: [`scripts/dt-doctor.sh`](scripts/dt-doctor.sh). Detalle: regla `07-orden-continuo` · [precedence](vitals/specs/precedence.md).

### Orquestación — macro vs micro

**Macro:** Clarificar → Planificar → Ejecutar → Entregar.

**Micro:** `/orquestar` = 8 pasos (clarificar … cierre documental).

```mermaid
flowchart LR
  req[Request]
  clarify[Clarify]
  gate{FastLane_or_validate}
  planExec[Plan_and_execute]
  deliver[Deliver]
  req --> clarify --> gate --> planExec --> deliver
```

Seguridad y secretos **siempre** aplican, incluso bajo `/fast-lane`.

### Vitals

| Layer | Path |
|-------|------|
| Index | [vitals/INDEX.md](vitals/INDEX.md) |
| Session (local) | `vitals/ops/session.yaml` |
| Team roster | `vitals/config/roster.yaml` |
| Commands meta | `vitals/config/commands-meta.yaml` |
| Concept doc | [docs/01_concepts/dt-vitals.md](docs/01_concepts/dt-vitals.md) |

| Script | Uso |
|--------|-----|
| [dt-doctor.sh](scripts/dt-doctor.sh) | Verificador read-only del orden |
| [sync-ide.sh](scripts/sync-ide.sh) | Emisor único multi-IDE (rules, skills, commands) |
| [sync-catalog.rb](scripts/sync-catalog.rb) | Catálogo de docs derivado del frontmatter |
| [sync-commands-from-meta.sh](scripts/sync-commands-from-meta.sh) | Commands desde `commands-meta.yaml` |
| [sync-skills-parity.sh](scripts/sync-skills-parity.sh) | Skills `.cursor/skills` → `.agents/skills` |
| [dt-publish-gate.sh](scripts/dt-publish-gate.sh) | Antes de publicar: ¿este checkout puede, y a qué remoto? |
| [dt-oficial.sh](scripts/dt-oficial.sh) | Marca local de `/oficial` (no va a Git) |
| [dt-context-profile.rb](scripts/dt-context-profile.rb) | Perfil de `/dt-config` (no va a Git) |

Detalle: [scripts/README.md](scripts/README.md).

### Subagentes (23) — resumen por grupo

| Grupo | Especialistas | Ejemplos de uso |
|-------|---------------|-----------------|
| **Engineering** | arquitecto, frontend, devops, ui-designer, remotion-producer | APIs, UI, deploy, Atelier, video |
| **Planning** | prd-creator, srd-creator, development-planner | PRD, specs técnicas, roadmap |
| **Testing** | qa, data-auditor, hack-audit | Tests, números, auditoría de seguridad |
| **Design & UX** | ux-researcher | Personas, journey mapping |
| **Product** | product-strategist, feedback-synthesizer, researcher | Priorización, research |
| **Documentation** | doc | README, ADRs, docs por niveles |
| **Marketing & Content** | content-creator, marketing-strategist, brand-guardian, growth-hacker, pitch-specialist, storytelling-specialist | Copy, campañas, pitch, narrativa |
| **Operations** | operations-maintainer | Monitoreo, incidentes |

Fuente canónica de skills: [`.cursor/skills/`](.cursor/skills/) (espejo Antigravity/Claude vía `sync-ide`). Reglas de delegación: [`.cursor/rules/03-catalogo-subagentes.mdc`](.cursor/rules/03-catalogo-subagentes.mdc).

**Skills de rutina DT** (no son subagentes): `dt-setup`, `dt-session`, `dt-config`, `dt-ordenar`, `git-actualizar`, `git-guardar`, `dt-drive`, `dt-actualizar`, `dt-oficial`, `github-save-release`.

**Skills de carril o diagnóstico** (sin subagente nuevo): `video-routing`, `recordly`, `brag`, `analisis-propuesta`.

**Skills con subagente dedicado** (command → skill → agente): `/hack` → `hack-audit` · `/verificar` → `data-auditor`. `/remotion` → `remotion-producer`.

#### Catálogo de los 23 especialistas

| # | Subagente | Grupo | Rol | Invocar cuando (keywords) | Agente (Cursor) | Skill de rol |
|---|-----------|-------|-----|---------------------------|-----------------|--------------|
| 1 | **arquitecto** | Engineering | Backend, APIs, arquitectura, patrones | `backend`, `api`, `database`, `server`, `arquitectura`, `SRD` | [agente](.cursor/agents/arquitecto.md) | [`.cursor/skills/arquitecto/`](.cursor/skills/arquitecto/) |
| 2 | **frontend** | Engineering | UI, componentes, accesibilidad | `frontend`, `ui`, `ux`, `interface`, `client`, `componentes` | [agente](.cursor/agents/frontend.md) | [`.cursor/skills/frontend/`](.cursor/skills/frontend/) |
| 3 | **devops** | Engineering | CI/CD, infra, deploy | `deploy`, `infrastructure`, `ci/cd`, `devops`, `pipelines` | [agente](.cursor/agents/devops.md) | [`.cursor/skills/devops/`](.cursor/skills/devops/) |
| 4 | **ui-designer** | Engineering | Orquestador **Atelier** + specs UI | `UI design`, `mockups`, `Atelier`, `landing`, `dashboard`, `design system` | [agente](.cursor/agents/ui-designer.md) | [`.cursor/skills/ui-designer/`](.cursor/skills/ui-designer/) |
| 5 | **remotion-producer** | Engineering | Carril **Remotion** — asset React | `Remotion`, `plantilla de video`, `Lambda`, `useCurrentFrame` | [agente](.cursor/agents/remotion-producer.md) | [`.cursor/skills/remotion-producer/`](.cursor/skills/remotion-producer/) |
| 6 | **prd-creator** | Planning | PRD, visión de producto, user stories | `product idea`, `requirements`, `PRD` | [agente](.cursor/agents/prd-creator.md) | [`.agents/skills/prd-creator/`](.agents/skills/prd-creator/) |
| 7 | **srd-creator** | Planning | SRD y specs técnicas desde PRD | `technical spec`, `SRD`, `PRD to technical` | [agente](.cursor/agents/srd-creator.md) | [`.agents/skills/srd-creator/`](.agents/skills/srd-creator/) |
| 8 | **development-planner** | Planning | Fases, MVP, roadmap, timelines | `development plan`, `phases`, `MVP`, `roadmap` | [agente](.cursor/agents/development-planner.md) | [`.agents/skills/development-planner/`](.agents/skills/development-planner/) |
| 9 | **qa** | Testing | Tests, edge cases, validación | `test`, `qa`, `quality`, `pruebas` | [agente](.cursor/agents/qa.md) | [`.cursor/skills/qa/`](.cursor/skills/qa/) |
| 10 | **ux-researcher** | Design & UX | Personas, journey, research UX | `user research`, `personas`, `UX`, `journey mapping` | [agente](.cursor/agents/ux-researcher.md) | [`.agents/skills/ux-researcher/`](.agents/skills/ux-researcher/) |
| 11 | **product-strategist** | Product | Priorización, roadmap de producto | `prioritization`, `roadmap`, `product strategy` | [agente](.cursor/agents/product-strategist.md) | [`.agents/skills/product-strategist/`](.agents/skills/product-strategist/) |
| 12 | **feedback-synthesizer** | Product | Síntesis de feedback en insights | `feedback`, `synthesis`, `insights` | [agente](.cursor/agents/feedback-synthesizer.md) | [`.agents/skills/feedback-synthesizer/`](.agents/skills/feedback-synthesizer/) |
| 13 | **researcher** | Product | Investigación y análisis de información | `research`, `analyze`, `investigate` | [agente](.cursor/agents/researcher.md) | [`.agents/skills/researcher/`](.agents/skills/researcher/) |
| 14 | **doc** | Documentation | Docs por niveles, README, ADRs | `document`, `docs`, `readme`, `documentación` | [agente](.cursor/agents/doc.md) | [`.agents/skills/doc/`](.agents/skills/doc/) |
| 15 | **content-creator** | Marketing & Content | Contenido multi-canal, SEO, brand | `content`, `copy` (contenido editorial) | [agente](.cursor/agents/content-creator.md) | [`.agents/skills/content-creator/`](.agents/skills/content-creator/) |
| 16 | **marketing-strategist** | Marketing & Content | Estrategia + **42 skills tácticas** | `marketing`, `CRO`, `SEO`, `ads`, `campaigns`, `growth` | [agente](.cursor/agents/marketing-strategist.md) | [`.cursor/skills/marketing-strategist/`](.cursor/skills/marketing-strategist/) |
| 17 | **brand-guardian** | Marketing & Content | Marca y brand guidelines | `brand`, `brand compliance` | [agente](.cursor/agents/brand-guardian.md) | [`.agents/skills/brand-guardian/`](.agents/skills/brand-guardian/) |
| 18 | **growth-hacker** | Marketing & Content | Experimentos y conversión | `growth`, `experiments`, `conversion` | [agente](.cursor/agents/growth-hacker.md) | [`.agents/skills/growth-hacker/`](.agents/skills/growth-hacker/) |
| 19 | **pitch-specialist** | Marketing & Content | Pitch inversores y stakeholders | `pitch`, `presentation`, `investors` | [agente](.cursor/agents/pitch-specialist.md) | [`.agents/skills/pitch-specialist/`](.agents/skills/pitch-specialist/) |
| 20 | **storytelling-specialist** | Marketing & Content | Narrativa y story arcs | `storytelling`, `narrative`, `story` | [agente](.cursor/agents/storytelling-specialist.md) | [`.agents/skills/storytelling-specialist/`](.agents/skills/storytelling-specialist/) |
| 21 | **operations-maintainer** | Operations | Monitoreo, incidentes, mantenimiento | `operations`, `monitoring`, `incidentes` | [agente](.cursor/agents/operations-maintainer.md) | [`.agents/skills/operations-maintainer/`](.agents/skills/operations-maintainer/) |
| 22 | **data-auditor** | Testing | Verificación de números y planillas con script (regla `16-numeric-grounding`) | `planilla`, `csv`, `excel`, `reporte`, `totales`, `reconciliar`, `verificar cifras` | [agente](.cursor/agents/data-auditor.md) | [`.cursor/skills/data-auditor/`](.cursor/skills/data-auditor/) |
| 23 | **hack-audit** | Testing | Auditoría de seguridad ofensiva-defensiva (`/hack`) | `hack`, `seguridad`, `vulnerabilidades`, `pentest`, `auth`, `permisos`, `IDOR`, `secrets`, `API security` | [agente](.cursor/agents/hack-audit.md) | [`.cursor/skills/hack-audit/`](.cursor/skills/hack-audit/) |

#### Marketing strategist — 42 skills tácticas

Origen: [marketingskills](https://github.com/coreyhaines31/marketingskills) v2. Contexto compartido: `.agents/product-marketing.md` (local).

| IDE | Orquestadora | Pack táctico |
|-----|--------------|--------------|
| **Cursor** | [`.cursor/skills/marketing-strategist/`](.cursor/skills/marketing-strategist/) | [`.cursor/skills/marketing/{skill}/`](.cursor/skills/marketing/) |
| **Antigravity** | [`.agents/skills/marketing-strategist/`](.agents/skills/marketing-strategist/) | [`.agents/skills/marketing/{skill}/`](.agents/skills/marketing/) |

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
| `video` | Video — carril en `tools/video/ROUTING.md` |

#### Atelier — detalle técnico

Atelier 2.0: **Impeccable vendoreado** + pack design/ nativo. Contexto: `.agents/design-context.md` (local).

| IDE | Router | Pack táctico | Vendor |
|-----|--------|--------------|--------|
| **Cursor** | [`.cursor/skills/atelier/`](.cursor/skills/atelier/) | [`.cursor/skills/design/`](.cursor/skills/design/) | [`tools/atelier/`](tools/atelier/) |

Motores: `ruby scripts/dt-design-select.rb` · `./scripts/atelier-detect.sh` (Impeccable CLI, 44+ reglas)

Actualizar Impeccable: `./tools/atelier/scripts/sync-from-impeccable.sh --latest` → `./scripts/sync-ide.sh` (ver `DOC-GUIDE-008`)

#### Video — detalle técnico

Carril en [`tools/video/ROUTING.md`](tools/video/ROUTING.md). `/recordly` baja el binario oficial de Recordly a `output/.cache/recordly/` (`./tools/video/install-recordly.sh`); no se clona el repo. `/brag` instala la skill upstream en `output/.cache/brag/` (`./tools/video/install-brag.sh`).

Remotion, cuando ese es el carril: toolkit en **[`tools/remotion/`](tools/remotion/)** (starter + primitivas). Best practices vendor: **`remotion-best-practices`**.

Actualizar vendor skill: `./tools/remotion/scripts/update-vendor-skills.sh` → `./scripts/sync-ide.sh`

### Git: qué va y qué no va al remoto

| Path | ¿En Git? | Por qué |
|------|----------|---------|
| `vitals/ops/session.yaml` | **No** | Quién está en **esta** PC ahora |
| `vitals/ops/canonical-checkout.yaml` | **No** | Marca de `/oficial`: esta carpeta puede publicar al DT |
| `vitals/ops/context-profile.yaml`, `99-perfil-local` | **No** | Qué reglas extra carga `/dt-config` |
| `vitals/ops/collaboration.local.yaml` | **No** | Postura `personal` o `team` en el checkout oficial |
| `vitals/config/roster.yaml` | **Sí** | Equipo registrado. En el remoto oficial viaja con `team: []` |
| `vitals/config/collaboration.yaml` | **Sí** en un proyecto propio | Postura del equipo. No entra al remoto oficial del DT |
| `vitals/workspace.yaml` | **No** | Multi-repo local (plantilla: `.example`) |
| `.env`, `*.credentials` | **No** | Secretos |
| `.agents/product-marketing.md` | **No** | Contexto de producto local |
| `.agents/design-context.md` | **No** | Contexto de diseño local |
| `.cursor/`, `.agents/`, `docs/`, skills | **Sí** | Comportamiento de la IA |

### Project layout

```text
README.md / AGENTS.md / VERSION
tools/                              # Arsenal reutilizable — tools/REGISTRY.md
.agents/                            # Contexto local (product-marketing, design-context)
docs/                               # Portal de documentación
vitals/
  config/                           # commands-meta.yaml, roster.yaml, rules-manifest.yaml
  specs/rule-bodies/                # Cuerpos de reglas (fuente única)
  data/                             # Registries (design, engineering)
  ops/                              # local: session (/yo), /oficial, /dt-config
  pulse/ memory/ specs/
  work/inbox/{operator_id}/

.cursor/                            # rules, commands, agents, skills (canónico)
.agents/                            # Antigravity + Codex: rules, workflows, skills
.antigravity/                       # Entrada Antigravity (rules.md)
.claude/ .codex/                    # Espejos generados — no editar a mano
output/                             # Generaciones locales (gitignored)
```

Multi-IDE: [ide-targets.yaml](vitals/config/ide-targets.yaml) · Guía: [ide-setup.md](docs/02_guides/ide-setup.md).

### Personalización

1. **Reglas:** editar `vitals/specs/rule-bodies/<stem>.body.md` + `vitals/config/rules-manifest.yaml` → `./scripts/sync-ide.sh`
2. **Commands:** editar `vitals/config/commands-meta.yaml` → `./scripts/sync-commands-from-meta.sh`
3. **Skills:** canónico en `.cursor/skills/` → `./scripts/sync-ide.sh`
4. **Multi-proyecto:** `vitals/workspace.yaml` desde [workspace.yaml.example](vitals/workspace.yaml.example)
5. **Verificar:** `./scripts/dt-doctor.sh`

### Documentation portal

- [docs/README.md](docs/README.md) — portal principal
- [Atelier templates](docs/03_reference/atelier-templates-index.md)
- [Tools registry](docs/03_reference/tools-registry.md)
- [Protocolo documentación IA](docs/99_meta/protocolo-documentacion-ia.md)

---

## License

MIT — see [LICENSE](LICENSE). Attribution: **@LucasMazalan** · [GitHub: Mazalucas](https://github.com/Mazalucas).
