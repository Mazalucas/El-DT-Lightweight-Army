# Arquitectura Backend

Stack default del DT: ver regla `08-stack-web-default` y `vitals/data/engineering/web-stack.yaml`.

## Stack default (proyecto web nuevo)

- **Backend/API**: Cloud Functions for Firebase (Node.js LTS)
- **Base de datos**: Firestore (Realtime DB solo si el caso lo exige)
- **Auth**: Firebase Auth
- **Secrets**: Firebase Secrets (ver regla `90-seguridad-secrets`)
- **Escalation**: Cloud Run + Firestore para workers pesados; SQL solo con opt-out explícito

Si el repo ya usa otro stack, respetarlo (soft default).

## Convenciones

- **Capas**: Separar lógica de negocio, acceso a datos y presentación (API)
- **APIs**: Usar convenciones REST; nombres en snake_case o camelCase según el stack
- **Manejo de errores**: Capturar y propagar con contexto; no tragar excepciones
- **Patrones**: Repository para datos; Service para lógica de negocio

## Ejemplo de manejo de errores

```typescript
// Evitar
try { await fetchData(); } catch (e) {}

// Preferir
try {
  await fetchData();
} catch (e) {
  logger.error('Failed to fetch', { error: e });
  throw new DataFetchError('Unable to retrieve data', { cause: e });
}
```

## APIs

- Documentar endpoints (OpenAPI/Swagger si aplica)
- Versionar APIs cuando sea necesario
- Validar input en el boundary

## Reutilización (reuse-first)

Regla transversal: `15-engineering-reuse` · skill `arquitecto` · `DOC-REF-006`.

- **Extender** handlers y services existentes antes de nuevos entrypoints paralelos
- **Validators compartidos** en boundary — no duplicar validación por handler
- **Repository/Service** existente: añadir métodos; evitar `*Repository2`, `*ServiceCopy`
- **Decisiones estructurales** (DB, breaking API): proponer ADR en `docs/05_decisions/` (ver skill `arquitecto/references/adr-triggers.md`)
