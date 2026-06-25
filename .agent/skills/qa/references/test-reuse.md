# Test reuse

## Buscar primero

- `tests/fixtures/`, `__fixtures__/`, `factories/`
- `test-utils`, `testing-library` helpers del repo
- Mocks globales en `setupTests`, `vitest.setup.ts`
- Page objects / screen objects en E2E

## Reglas

| Regla | Acción |
|-------|--------|
| Mismo usuario mock en 3 tests | Factory `createTestUser()` |
| Mismo `beforeEach` en 5 archivos | Mover a `tests/setup/` |
| Mock de Firebase/API | Helper compartido `mockFirestore()` |

## Un concepto, un helper

No `mockAuth2.ts` si `mockAuth.ts` existe — extender.

## Datos de prueba

- Preferir factories sobre objetos inline duplicados
- Snapshots: solo cuando el output es estable y documentado

## Regresión

Añadir casos al suite existente del dominio (`auth.test.ts`) antes de archivo `auth-export.test.ts` huérfano.
