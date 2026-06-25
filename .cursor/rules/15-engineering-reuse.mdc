---
description: Ingeniería reuse-first — discover before create, jerarquía de reutilización, entregable Qué reutilicé
alwaysApply: true
---

# Ingeniería reuse-first

Fuente humana: `docs/03_reference/engineering-reuse-default.md` (`DOC-REF-006`). Skill táctica: `.cursor/skills/engineering-reuse/SKILL.md`.

## Cuándo aplica

**Siempre** que un agente o el DT vaya a **proponer, escribir o modificar código ejecutable** (backend, frontend, infra, tests, Remotion).

No aplica a: specs puras sin código (PRD, copy marketing), docs narrativos, pulse/vitals del framework.

## Jerarquía de reutilización (orden de preferencia)

1. **Extender código existente del repo** — handlers, componentes, hooks, workflows, fixtures.
2. **Usar design system o librería ya adoptada en el proyecto** — tokens, primitivas UI, SDK interno.
3. **Componer desde primitivas del framework** — React, Firebase SDK, Remotion APIs.
4. **Crear nuevo** — solo si no hay alternativa razonable.
5. **Documentar por qué no reutilizaste** — obligatorio al crear algo nuevo.

## Pipeline pre-código (obligatorio)

```text
Mapear → Reutilizar → Extender → Crear
```

1. **Mapear**: buscar en el repo (grep, índice, docs de arquitectura) artefactos relacionados.
2. **Reutilizar**: importar, parametrizar o componer lo encontrado sin duplicar.
3. **Extender**: añadir props, endpoints, jobs o casos a módulos existentes (diff mínimo).
4. **Crear**: archivo nuevo solo tras documentar ausencia de equivalente.

## Reglas derivadas

- **Discover before create** — no proponer archivos nuevos sin búsqueda previa.
- **Minimal diff** — extender > refactorizar local > reescribir.
- **YAGNI** — no abstraer hasta la tercera repetición real en el repo.
- **Un concepto, un módulo** — no `utils2`, `ButtonCopy`, `service-v2` paralelos.

## Prohibiciones

- Duplicar utilidades, validators o helpers con la misma responsabilidad.
- Copiar-pegar lógica entre capas en lugar de extraer una vez.
- Inventar componentes UI si existe equivalente en el design system del repo.
- Duplicar stages/jobs en CI cuando un workflow existente puede extenderse.
- Clonar composiciones Remotion enteras en lugar de parametrizar `defaultProps`.

## Entregable obligatorio (código)

Toda entrega que incluya código debe tener la sección:

```markdown
## Qué reutilicé
- [artefacto] — [cómo se extendió o importó]

## Qué creé y por qué
- [archivo/nuevo módulo] — [motivo si no había alternativa]
```

Si solo reutilizaste: la segunda sección puede ser "N/A — todo extendido desde existente".

## Al delegar agentes de código

Incluir **Bloque ingeniería reuse** (ver `03-catalogo-subagentes`) junto al bloque stack web cuando aplique.

Agentes afectados: `arquitecto`, `frontend`, `devops`, `qa`, `remotion-producer`.
