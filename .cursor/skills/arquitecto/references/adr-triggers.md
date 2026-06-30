# ADR triggers

Proponer ADR en `docs/05_decisions/` cuando la decisión sea **estructural** y difícil de revertir.

## Disparadores (sí → ADR)

- Nueva capa o bounded context en el backend
- Cambio de base de datos (Firestore → SQL o viceversa)
- Breaking change en API pública (versionado, contrato)
- Nuevo patrón transversal (event bus, CQRS, cache layer)
- Opt-out del stack DT (Postgres, Python backend) con justificación

## No requiere ADR

- Nuevo endpoint en dominio existente con mismos patrones
- Extensión de schema Firestore backward-compatible
- Bugfix o refactor local sin cambio de contrato

## Plantilla mínima

Usar formato ADR de `02-documentacion`: Contexto → Decisión → Consequencias.

Registrar ID en `docs/99_meta/id-registry.md` si dominio DEC nuevo.

## Reutilizar ADRs previos

Antes de proponer ADR, buscar `docs/05_decisions/` — puede que la decisión ya esté tomada.
