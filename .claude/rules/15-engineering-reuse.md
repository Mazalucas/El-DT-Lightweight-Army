---
description: OBLIGATORIO al escribir o modificar código — discover before create, sección Qué reutilicé
globs: "**/*.ts, **/*.tsx, **/*.js, **/*.jsx, **/*.py, **/*.go, **/src/**"
alwaysApply: false
---

# Ingeniería reuse-first

Carga automática con globs de código en manifest. Detalle: `docs/03_reference/engineering-reuse-default.md` (`DOC-REF-006`) · skill `.cursor/skills/engineering-reuse/SKILL.md`.

## Cuándo aplica

Al **proponer, escribir o modificar código ejecutable** (backend, frontend, infra, tests, Remotion). No aplica a PRD/copy puro, docs narrativos, pulse del framework.

## Jerarquía (orden estricto)

1. Extender **código existente** del repo
2. Design system / librería ya adoptada
3. Primitivas del framework
4. **Crear nuevo** — solo sin alternativa razonable; documentar por qué

## Pipeline

```text
Mapear → Reutilizar → Extender → Crear
```

Discover before create · diff mínimo · YAGNI · un concepto, un módulo (no `utils2`, `*-v2` paralelos).

## Prohibiciones

Duplicar helpers/validators/UI/CI stages con la misma responsabilidad; copiar-pegar entre capas; clonar composiciones Remotion enteras.

## Entregable (código)

```markdown
## Qué reutilicé
- [artefacto] — [cómo se extendió]

## Qué creé y por qué
- [módulo] — [motivo]  (o N/A si todo extendido)
```

## Delegación

Agentes de código: `arquitecto`, `frontend`, `devops`, `qa`, `remotion-producer` — incluir bloque reuse (ver `03-catalogo-subagentes`).
