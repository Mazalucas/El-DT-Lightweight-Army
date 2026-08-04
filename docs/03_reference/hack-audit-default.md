---
id: DOC-REF-010
title: Auditoría de seguridad del DT (hack-audit)
type: reference
status: canonical
owner: dt-platform
created: 2026-08-04
updated: 2026-08-04
tags:
  - security
  - audit
  - hack
  - vulnerabilities
domain:
  - reference
summary: Protocolo de auditoría ofensiva-defensiva del propio proyecto — contexto de amenaza, matriz de severidad, compuerta anti-alucinación, evidencia determinista y baseline de riesgo.
related:
  - DOC-REF-006
  - DOC-REF-009
  - DOC-META-001
priority: high
intended_audience:
  - engineers
  - ai-agents
source_of_truth: true
review_cycle_days: 90
---

# Auditoría de seguridad del DT (hack-audit)

Referencia humana del flujo **`/hack`**: cómo el DT audita el propio proyecto con mentalidad de atacante y entrega defensiva (hallazgos trazados, priorizados y anclados al repo).

Fuente machine-readable: skill `.cursor/skills/hack-audit/` · subagente `.cursor/agents/hack-audit.md` · command `/hack`.

## Por qué existe

Todo proyecto acumula superficie de ataque (auth, API, reglas de acceso, secretos, CI, y hoy también agentes y MCP) que nadie revisa hasta que hay un incidente. `/hack` fuerza una pasada sistemática, puntuada y comparable entre corridas.

## Regla de oro

Pensar como atacante, entregar como defensor. **Prohibido** generar exploits, PoCs ofensivos o pegar el valor de un secreto.

## Los cuatro pilares

Lo que separa esta auditoría de un checklist corrido a ojo:

1. **Contexto de amenaza primero** — exposición, joyas de la corona, datos sensibles y adversario realista se establecen antes de puntuar. La misma debilidad no vale lo mismo en un prototipo local que en producción con datos personales.
2. **Compuerta anti-alucinación** — un hallazgo solo es CONFIRMADO si se trazó el dato desde su origen hasta el sink **y** se nombraron los controles revisados que no lo cubren. Sin traza va a Sospechas, con tope MEDIUM y en sección aparte. Es el equivalente de seguridad a la regla `16-numeric-grounding`: la afirmación necesita evidencia, no patrón.
3. **Cadenas de ataque** — los hallazgos no son islas. El informe incluye 1–3 rutas de compromiso extremo a extremo, y la cadena se puntúa por su resultado, que puede exceder al de sus eslabones.
4. **Evidencia determinista** — antes del juicio del modelo se corren los scanners disponibles (los del propio proyecto, `tools/security/scan-repo.sh` y taint con semgrep si está instalado), y el informe lista los comandos ejecutados. Lo que no se pudo correr se declara en Cobertura y baja la confianza, en vez de disimularse.

A esos cuatro se suma un **autochequeo obligatorio** antes de entregar: la compuerta falla en dos direcciones —colar sospechas como confirmados, y sobrecorregir hasta entregar un informe que no compromete nada— y la pasada de autochequeo controla ambas (`references/severity-rubric.md` §4.1).

## Alcance

| Invocación | Alcance |
|------------|---------|
| `/hack` | Full repo — los 9 dominios (default) |
| `/hack auth` · `api` · `authz` · `secrets` · `data` · `frontend` · `infra` · `arquitectura` · `agents` | Un dominio |
| `/hack diff` · `/hack pr` | Cambios vs base, con contexto más allá del hunk |

En repos grandes (umbral computable: más de ~600 archivos fuente en alcance) se delega un subagente por dominio en paralelo, y el reparto es asimétrico porque el fan-out apagaría las cadenas de ataque: el **padre** fija el contexto de amenaza una sola vez y lo pasa idéntico a cada hijo, los **hijos** solo cazan su dominio y devuelven hallazgos con `id` estable, y el **padre** deduplica, encadena, prioriza y entrega. La estrategia se declara en el informe: nunca se muestrea en silencio.

## Severidad y prioridad

Severidad por **matriz 5×5** (impacto × probabilidad), con modificador de exposición; **CVSS 3.1** solo en CRITICAL y HIGH. La prioridad (P0–P3) es un eje distinto: combina severidad, exposición y esfuerzo (`S`/`M`/`L`). Rúbrica completa: `.cursor/skills/hack-audit/references/severity-rubric.md`.

Los secretos se clasifican por tipo × estado — un placeholder no es un incidente, y una credencial en el historial exige **rotar**, no solo borrar.

## Entrega e higiene del artefacto

1. Canvas del IDE (regla `17-canvas-first`), sin commitear.
2. `vitals/work/audits/YYYY-MM-DD-hack-audit.md` — **gitignoreado**.
3. Chat como último recurso.

El informe es un mapa de debilidades con paths exactos: no viaja al remoto ni a un issue público. Para seguimiento compartido se versiona solo el registro de riesgo.

## Baseline de riesgo

`vitals/security/baseline.yaml` (versionado) guarda hallazgos abiertos, riesgos aceptados con dueño y fecha, y resueltos. Cada auditoría clasifica en **NUEVO / PERSISTENTE / RESUELTO / ACEPTADO**, de modo que la pregunta "¿qué cambió desde la última vez?" tenga respuesta y los riesgos aceptados no se re-reporten como hallazgos nuevos.

## Piezas del stack

| Pieza | Path |
|-------|------|
| Skill (delgada) | `.cursor/skills/hack-audit/SKILL.md` |
| Recetas de caza (9 dominios) | `.cursor/skills/hack-audit/references/attack-surface.md` |
| Rúbrica y compuerta de confianza | `.cursor/skills/hack-audit/references/severity-rubric.md` |
| Plantilla + ejemplo calibrado | `.cursor/skills/hack-audit/references/report-template.md` |
| Cómo validar al auditor | `.cursor/skills/hack-audit/references/calibration.md` |
| Subagente #23 | `.cursor/agents/hack-audit.md` |
| Scanner determinista | `tools/security/scan-repo.sh` (`tools/security/README.md`) |
| Taint opcional (nivel 3) | `tools/security/semgrep/taint-web.yaml` |
| Banco de calibración | `tools/security/make-fixtures.sh` (7 plantadas + 5 señuelos, en `output/`) |
| Baseline de riesgo | `vitals/security/baseline.yaml` |
| Command | `/hack` (`vitals/config/commands-meta.yaml`) |
| Reglas | `17-canvas-first`, `90-seguridad-secrets`, `15-engineering-reuse` |

## Paridad multi-IDE

Cursor y Claude Code exponen el subagente; en Antigravity y Codex `/hack` ejecuta la skill en la conversación (`vitals/config/ide-targets.yaml` — solo esos destinos reciben `agents_dir`).

## Relación con otros roles

Implementar los fixes es de `arquitecto` / `frontend` / `devops`; los tests de regresión, de `qa`; las cifras de planillas, de `data-auditor` (`/verificar`).
