# Rúbrica — auditoría legal

La severidad no sale del susto del video. Sale de si el patrón está en el repo, de si el territorio entra, y de qué puede afirmarse.

## Estados

| Estado | Cuándo | Severidad |
|--------|--------|-----------|
| **Confirmado** | Hay archivo, configuración en el repo, o ausencia real de una pieza que el control exige (buscaste la página legal y no está) | La del control, si el patrón peligroso está |
| **Sospecha** | Indicio sin traza completa (un SDK que *puede* grabar sesiones, sin ver la config) | Tope **Alto**. Nunca Crítico |
| **Sin evidencia** | No encontraste ni el patrón ni el control que lo cerraría, y el producto parece tener esa superficie | No puntúes Crítico. Pedí el archivo o la URL que falta |
| **No verificable** | La prueba vive fuera del repo (contrato, registro, panel, email ya enviado, facturación) | No es un "cumple". Va a la sección fuera del código. Tope **Alto** como recordatorio, no como hallazgo de código |
| **No aplica** | Fuera de territorio, o el disparador no existe (no hay SMS, no hay subidas, no hay cobro) | Sin severidad. Igual se lista en cobertura |

## Techo del catálogo

`severity` en `controls.yaml` es el techo **si el patrón está y el territorio entra**.

- **Crítico** — daño por evento o pérdida de un puerto seguro, y el patrón se ve: registro que recoge datos sin edad, session replay o teclas, suscripción sin el texto de renovación junto al botón, subidas de usuarios sin página de agente, PAN de tarjeta en tu backend, SMS comercial sin rastro de consentimiento, biometría.
- **Alto** — falta un aviso, un consentimiento o un contrato que el régimen pide, y eso se ve o se constata como ausencia (fuentes de Google, cookies antes de elegir, email UE sin opt-in, sin política).
- **Medio** — el hueco es de completitud, conservación, accesibilidad o un procedimiento que el repo no puede cerrar.
- **Bajo** — ajuste de copia o de identificadores cuando lo esencial ya está.

Un umbral de negocio no está en el código (ingresos, "vendemos datos", "tenemos 100.000 californianos"). Eso no convierte un control en Crítico. Queda No verificable con la pregunta que falta.

## Cifras

Cada `figure` tiene `as_of`. Leela así en el informe:

- Es un **techo** legal o un **fallo concreto**, no una factura automática.
- Si la fecha de hoy es posterior a `as_of`, no actualices el número de memoria.
- La regla FTC «click to cancel» no se da por vigente. El catálogo ya lo dice en AUTO-RENEW.

## Autochequeo

1. ¿Cada Crítico tiene path o ausencia buscada?
2. ¿Algún "cumple" tapa un `standing_gap`? Si sí, pasalo a No verificable.
3. ¿El territorio está en el encabezado, como inferido o como supuesto?
4. ¿La sección fuera del código explica qué es cada hueco, en castellano, no con la sigla sola?
