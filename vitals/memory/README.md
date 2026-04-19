# Memoria sugerida del DT (`vitals/memory`)

La memoria aquí **no sustituye** las Project Rules del IDE. Es un **bandeja de propuestas** cuando se detectan patrones repetidos de trabajo o preferencias del equipo.

## Flujo

1. **inbox/** — Propuestas con `status: proposed`. Incluir siempre `evidence[]` (p. ej. `pulse_id`, commits, enlaces).
2. El **usuario aprueba o rechaza** explícitamente en conversación.
3. **accepted/** — Copia archivada de lo aprobado (historial). La aplicación real es un **patch manual** a `.cursor/rules/`, User Rules, o proyecto.

**Nunca** promover a reglas ejecutables sin confirmación del usuario.

Especificación completa: [../specs/protocolo-memoria-dt.md](../specs/protocolo-memoria-dt.md).
