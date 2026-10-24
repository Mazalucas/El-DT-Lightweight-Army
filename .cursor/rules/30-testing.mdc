---
description: Convenciones de testing, cobertura mínima, tipos de tests, mocks
globs: "**/*.test.*, **/*.spec.*, **/tests/**/*, **/__tests__/**/*"
alwaysApply: false
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

## Bugfix (causa raíz primero)

Al corregir un bug, antes de tocar el código:

1. **Reproducir** el fallo.
2. **Nombrar la causa raíz** en una línea. Si solo ves el síntoma, seguí investigando.
3. **Test que falle** antes del fix y pase después. Sin suite: un script de repro, o decir por qué no aplica.
4. Reportar en la entrega: causa, test, resultado antes/después.

No aplica a cambios triviales (typo, texto, formato).

## Reutilización (reuse-first)

Regla transversal: `15-engineering-reuse` · skill `qa` · `DOC-REF-006`.

- **Fixtures y factories compartidos** — no duplicar setup por archivo
- **Un helper por concepto** — extender mocks existentes
- **Ejecutar suite del repo** cuando exista toolchain (skill `qa/references/toolchain.md`)
