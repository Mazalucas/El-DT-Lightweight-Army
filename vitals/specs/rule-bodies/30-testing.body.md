# Testing

## Tipos de tests

- **Unit**: Lógica aislada; mocks para dependencias
- **Integration**: Múltiples unidades; preferir tests reales sobre mocks cuando sea práctico
- **E2E**: Flujos críticos de usuario

## Cobertura

- Priorizar código crítico (lógica de negocio, edge cases)
- No obsesionarse con 100%; calidad sobre cantidad

## Mocks

- Mockear dependencias externas (APIs, DB)
- Evitar mocks excesivos que oculten bugs de integración

## Estructura

- Un test file por módulo/componente
- Nombres descriptivos: `describe('FeatureX', () => { it('should do Y when Z', ...) })`

## Reutilización (reuse-first)

Regla transversal: `15-engineering-reuse` · skill `qa` · `DOC-REF-006`.

- **Fixtures y factories compartidos** — no duplicar setup por archivo
- **Un helper por concepto** — extender mocks existentes
- **Ejecutar suite del repo** cuando exista toolchain (skill `qa/references/toolchain.md`)
