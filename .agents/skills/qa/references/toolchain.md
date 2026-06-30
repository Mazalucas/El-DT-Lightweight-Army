# Toolchain — ejecutar suite existente

## Obligatorio en entrega

Indicar resultado de verificación:

```markdown
## Verificación
- Comando: `npm test` / `pnpm vitest` / `pytest`
- Resultado: pass | fail (detalle) | N/A (razón)
```

## Detectar toolchain

| Señal | Comando típico |
|-------|----------------|
| `package.json` scripts.test | `npm test` |
| vitest.config | `npx vitest run` |
| jest.config | `npx jest` |
| pytest.ini / pyproject | `pytest` |
| go.mod | `go test ./...` |

## Si no hay tests en repo

- Declarar N/A
- Proponer ubicación alineada con convención del stack (no inventar framework distinto sin razón)

## CI

Si el repo tiene CI de test, mencionar que el PR debe pasar el mismo job — reutilizar config, no duplicar lógica de test en script ad hoc.

## Regla `30-testing`

Aplicar tipos unit / integration / E2E según criticidad; mocks razonables.
