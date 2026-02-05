---
description: Convenciones de testing, cobertura mínima, tipos de tests, mocks
globs: "**/*.test.*, **/*.spec.*, **/tests/**/*, **/__tests__/**/*"
---

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
