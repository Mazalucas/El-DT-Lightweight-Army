# Firebase modules — reutilizar antes de crear

## Orden de búsqueda

1. `functions/src/index.ts` — exports existentes
2. Archivos por dominio (`auth.ts`, `reports.ts`, `users.ts`)
3. `firestore.rules` — reglas reutilizables por path pattern
4. `firestore.indexes.json` — índices compuestos existentes
5. Shared: `functions/src/lib/`, `shared/`, `types/`

## Extender vs nuevo entrypoint

| Situación | Acción |
|-----------|--------|
| Misma colección, nueva operación | Método en service + handler en archivo de dominio |
| Nuevo dominio de negocio | Nuevo módulo + export en index |
| Misma validación en 2 handlers | Validator compartido en `lib/validators/` |

## Reglas Firestore

- Extender match blocks existentes
- No duplicar `allow read` idénticos — factorizar con funciones helper en rules si el lenguaje lo permite

## Cloud Functions

- Reutilizar middleware de auth existente
- Mismo `region` y `runtime` que el resto del proyecto
- Secrets: referenciar nombres ya definidos en Firebase

## Deploy

Coordinar con **devops** — no inventar script `deploy-xyz.sh` si `firebase deploy` ya está en CI.
