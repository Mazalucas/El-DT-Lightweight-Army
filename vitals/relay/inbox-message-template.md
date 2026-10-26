# Plantilla de mensaje de inbox

Contrato: [`../specs/agent-inbox.md`](../specs/agent-inbox.md). Preferí `./scripts/dt-agent.sh send`, que genera nombre y frontmatter y aplica los topes. A mano: `vitals/work/inbox/{to}/YYYYMMDD-HHMM-{from}-{slug}.md`.

```markdown
---
from: <id remitente>
to: <id destinatario>
type: request        # request | handoff | question | fyi | cancel
status: open         # open | claimed | paused | done | declined (solo lo cambia el destinatario)
created: "<ISO8601>"
reply_to:            # opcional: archivo al que responde
expires:             # opcional: fecha tras la cual ya no sirve
refs: []             # opcional: paths, commits, pulse_id
---

## Pedido

Qué necesitás, en 1–3 líneas.

## Contexto

- Archivos / commits relevantes:
- Restricciones:

## Entregable esperado

Cómo se ve "hecho".

## Registro

<!-- lo agrega dt-agent en cada cambio de estado: fecha, autor, estado, nota -->
```
