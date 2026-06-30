# Pattern matrix (backend)

Elegir patrón según contexto — no catálogo abstracto.

| Patrón | Cuándo usar | Cuándo NO | Reutilizar |
|--------|-------------|-----------|------------|
| **Repository** | Acceso Firestore/DB encapsulado; queries repetidas | Lógica de negocio compleja en repo | Extender repo existente antes de `UserRepository2` |
| **Service** | Orquestación de negocio, transacciones, varios repos | CRUD trivial de un documento | Añadir método al service existente |
| **Handler thin** | Cloud Function = validar input → service | Lógica de negocio en handler | Nuevo export en mismo archivo de functions si cohesivo |
| **Direct SDK** | Prototipo único, script one-off | Producción con reglas de negocio | Migrar a Service cuando crece |
| **Events / webhooks** | Side effects desacoplados, integraciones | Flujo síncrono simple | Reutilizar topic/trigger existente |

## Trade-offs rápidos

- **Repository vs direct Firestore en handler**: repo cuando hay ≥2 call sites o tests unitarios del acceso a datos.
- **Monolito functions vs micro-functions**: preferir agrupar por dominio (`reports.ts`, `auth.ts`) y extender.
- **REST vs callable**: REST para clientes externos; callable si ya usa el proyecto Firebase callable.

## Firebase default (DT)

- Validar en boundary (handler)
- Reglas Firestore como capa de autorización — no duplicar checks solo en cliente
- Secrets: Firebase Secrets — nunca en código
