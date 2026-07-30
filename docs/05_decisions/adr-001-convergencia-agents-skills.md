---
id: DOC-DEC-001
title: "ADR-001: Convergencia en AGENTS.md + Skills como estándar multi-IDE"
type: decision
status: canonical
owner: dt-platform
created: 2026-06-13
updated: 2026-06-13
tags:
  - adr
  - multi-ide
  - skills
domain:
  - meta
summary: Decisión de generar todos los IDEs desde fuentes canónicas únicas mediante un registro declarativo (ide-targets.yaml), convergiendo en los estándares portables AGENTS.md y SKILL.md.
related:
  - DOC-GUIDE-001
  - DOC-DEC-002
keywords:
  - AGENTS.md
  - SKILL.md
  - ide-targets
  - sync-ide
priority: high
intended_audience:
  - engineers
  - ai-agents
source_of_truth: true
review_cycle_days: 180
---

# ADR-001: Convergencia en AGENTS.md + Skills como estándar multi-IDE

## Contexto

El DT empezó como template dual (Cursor + Antigravity) con reglas y skills duplicadas a mano en cada IDE. El sync de reglas era parcial (solo `04`/`05` salían de `rule-bodies/`), lo que multiplicaba el trabajo manual y producía drift silencioso. Sumar Codex, Claude Code y Copilot habría amplificado el problema.

## Decisión

1. **Fuente única total:** el cuerpo de **todas** las reglas vive en `vitals/specs/rule-bodies/*.body.md` con metadata en `vitals/config/rules-manifest.yaml`.
2. **Registro declarativo de IDEs:** `vitals/config/ide-targets.yaml` describe cada IDE (entrada, dirs, formato de frontmatter, flags). Agregar un IDE = agregar una entrada.
3. **Emisor único:** `scripts/sync-ide.rb` recorre el registro y emite todos los destinos.
4. **Estándares portables:** convergemos en `AGENTS.md` (entrada cross-tool, la usa Codex y Cursor) y `SKILL.md` (extensión cross-agent). Claude y Copilot reciben **punteros** generados a `AGENTS.md`.
5. **Verificación:** `scripts/dt-doctor.rb` valida paridad multi-IDE y el resto del orden.

## Alternativas consideradas

- **Mantener copias a mano por IDE:** descartada — no escala y viola la fuente única que el propio protocolo predica.
- **Un solo IDE:** descartada — el objetivo es inclusividad multi-IDE.

## Consecuencias

- **Pros:** sin drift entre IDEs; sumar un IDE es trivial; el orden es verificable.
- **Contras:** más scripts y un registro nuevo que aprender; los destinos no se editan a mano (hay que correr el emisor).

## Notas

Colisión histórica `.agent/` (Antigravity legacy) vs `.agents/` (Codex + Antigravity 2.0): convergido en **`.agents/`** para rules, workflows y skills; `.agents/product-marketing.md` y contexto local siguen en la raíz de `.agents/`.
