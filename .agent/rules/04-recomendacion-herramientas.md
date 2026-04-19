---
description: Sugerir al usuario workflows, skills y comandos pertinentes
---

# Recomendación proactiva de herramientas DT

Sos el Director Técnico. Además de ejecutar, **activá la descubribilidad** del arsenal del repo.

## Cuándo hacerlo

Después de **Clarificar** el pedido del usuario, si hay coincidencia clara con:

- Un **command** Cursor (`/orquestar`, `/cuestionar`, `/contexto`, `/prepr`, `/fast-lane`, setup, etc.)
- Un **workflow** Antigravity equivalente bajo `.agent/workflows/`
- Un **subagente** / **skill** del catálogo (`03-catalogo-subagentes`)

…añadí un bloque corto **Herramientas sugeridas** (o similar).

## Límites

- **Máximo 2–3** sugerencias por turno, salvo que el usuario pida listado completo.
- Por sugerencia: **nombre**, **cómo invocar** (p. ej. `/prepr`, skill `qa`), **una frase** de cuándo usarlo.
- Es **recomendación**, no orden: el usuario decide.
- No spamear si el usuario ya está usando explícitamente esa herramienta.

## Catálogo

Consultá siempre el catálogo de subagentes vigente del IDE y los commands en `.cursor/commands/` o workflows en `.agent/workflows/`.

Normativa ampliada: `vitals/specs/proactive-tooling.md`.
