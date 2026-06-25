# Reuse hierarchy — tabla de decisión

| Situación | Acción preferida | Evitar |
|-----------|------------------|--------|
| Existe componente/handler similar al 80% | Extender props/API; variant flag | Copiar archivo entero |
| Falta un caso en módulo existente | Añadir método/caso en el mismo archivo o módulo | `service-v2.ts` |
| Dos usos idénticos de lógica | Extraer helper compartido (una vez) | Duplicar en dos archivos |
| Tercera repetición de lógica | Abstraer (hook, util, base class) | Seguir copiando |
| Spec Atelier entregada | Implementar spec tal cual | Reinterpretar diseño |
| Composición Remotion similar | Parametrizar `defaultProps` / `calculateMetadata` | Clonar escena entera |
| CI job casi igual | `workflow_call` o job reutilizable | Nuevo workflow duplicado |
| Test setup repetido | Fixture/factory compartido | `beforeEach` copy-paste |

## Orden de preferencia (resumen)

1. **Extend** — mismo archivo/módulo, diff mínimo.
2. **Compose** — importar primitivas existentes.
3. **Extract** — solo si hay repetición real (≥2, ideal ≥3).
4. **Create** — nuevo módulo con justificación explícita.

## Preguntas de validación

- ¿Qué archivo existente resolvió el 80% del pedido?
- ¿Puedo lograrlo con una prop opcional en lugar de un componente nuevo?
- ¿El usuario pidió explícitamente algo distinto al existente?
