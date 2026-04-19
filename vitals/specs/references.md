# Referencias externas (diseño, no dependencias)

## OpenClaw / ecosistema agentico

- **Aclaración:** No hay evidencia pública de que Anthropic haya “comprado CLAW”. El ecosistema público incluye **OpenClaw** (antes conocido como Clawdbot), herramientas de monitoreo satélite, y políticas de suscripción vs herramientas terceras.
- **Timeline (referencia):** [Anthropic and OpenClaw timeline](https://www.knightli.com/en/2026/04/08/anthropic-openclaw-timeline-2026-04/)

## Ideas de diseño reutilizables (sin acoplar)

- **Telemetría y “latidos”:** metáfora de pulso periódico de qué hizo el agente → nuestro `vitals/pulse/`.
- **Consolidación de memoria:** en reportes públicos se menciona enfoques tipo “Dreaming” / consolidación; aquí lo traducimos a **inbox → accepted** con opt-in humano, no a un servicio externo.

## Vitals y este repo

`vitals/` es **autónomo**: no requiere OpenClaw ni ningún runtime adicional. Las referencias son solo lectura para inspiración de producto.
