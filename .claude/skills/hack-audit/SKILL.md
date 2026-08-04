---
name: hack-audit
description: >-
  Auditoría de seguridad ofensiva-defensiva del propio proyecto. Use when
  /hack, hack, seguridad, vulnerabilidades, pentest, auth bypass, IDOR,
  permisos, secrets, API security, prompt injection, MCP, threat model,
  auditar seguridad, "¿es seguro esto?", revisar antes de deploy.
  Mentalidad de atacante; entrega defensiva sin exploits.
---

## Protocolos DT (heredar)

Subagente del Director Técnico: ordenar, cuestionar, alternativas, **Contexto consultado**, **Puntos ciegos / Mejoras detectadas**, post-delegación. Multi-agente: `DEFER: <rol>`.

## Activación

`/hack`, mención de esta skill o delegación → si el IDE expone subagentes, correr como **`hack-audit`** (`.cursor/agents/hack-audit.md`); si no (Antigravity, Codex), ejecutar este pipeline en la conversación.

## Mandato duro (no negociable)

1. **Sin ofensiva ejecutable** — nada de exploits, PoCs, payloads, malware ni comandos de ataque. El escenario se describe en prosa.
2. **Sin alucinar vulnerabilidades** — ningún hallazgo se afirma sin (a) traza del dato desde su origen hasta el sink y (b) **búsqueda activa del control que lo desmiente** (middleware, rules, validación aguas arriba). Sin traza completa → va a **Sospechas**, nunca a Confirmados, y no puede ser CRITICAL/HIGH. Detalle: `references/severity-rubric.md`.
3. **Evidencia determinista primero** — correr los scanners disponibles antes de juzgar a ojo (orden en `references/attack-surface.md` §0). El informe lista los comandos ejecutados.
4. **Secretos** — nunca pegar el valor: redactar y clasificar por tipo × estado (`severity-rubric.md`). Un placeholder no es un incidente.
5. **Higiene del artefacto** — el informe nombra tus debilidades: vive gitignoreado en `vitals/work/audits/`. Nunca commitearlo ni pegarlo en un issue público.
6. **Anclado al repo** — fixes concretos sobre paths reales; nada de teoría OWASP genérica.

## Alcance

| Invocación | Alcance |
|------------|---------|
| `/hack` | **Full repo** — los 9 dominios |
| `/hack auth` · `api` · `authz` · `secrets` · `data` · `frontend` · `infra` · `arquitectura` · `agents` | Un dominio |
| `/hack diff` · `/hack pr` | Cambios vs base (`git diff <base>...HEAD`) **con contexto**: un sink introducido en el diff puede tener su origen fuera del hunk |
| Texto libre | Parsear dominio/paths; si es ambiguo, full |

## Repos grandes (fan-out)

Umbral medible, no intuición:

```bash
git ls-files | grep -Ec '\.(ts|tsx|js|jsx|mjs|py|go|rb|java|php|rules|ya?ml)$'
```

Más de ~600 archivos fuente en alcance → **un subagente por dominio en paralelo**. Nunca muestrear en silencio: la estrategia y el conteo van al informe.

El fan-out apagaría las cadenas de ataque (cruzan dominios por definición), así que el reparto es asimétrico:

- **El padre** establece el contexto de amenaza **una sola vez** y lo pasa idéntico a cada hijo — si cada uno infiere su propia exposición, las severidades dejan de ser comparables.
- **Los hijos** cazan un dominio y devuelven hallazgos con `id` kebab-case estable, severidad e impacto/probabilidad crudos. **No encadenan, no priorizan, no escriben el informe.**
- **El padre** deduplica por `id`, hace la pasada de **encadenamiento**, prioriza y entrega. Es el único que ve todo.

## Pipeline

0. **Contexto de amenaza** — joyas de la corona, exposición (prod / interno / local), adversario realista, datos sensibles, blast radius aceptable. Se infiere del repo y se pregunta lo que falte: **sin esto la severidad es decorativa**. Detalle: `references/severity-rubric.md` §1.
1. **Reconocer superficie** — scanners + mapa de entradas, identidad, datos, deploy, trust boundaries. Recetas: `references/attack-surface.md`.
2. **Amenazar** — STRIDE y abuse cases por actor (anónimo, user, admin, insider, CI, supply-chain, **agente/IA**).
3. **Cazar** — recorrer los dominios del alcance con las recetas; cada hallazgo anclado a evidencia.
4. **Encadenar** — combinar hallazgos en **1–3 cadenas de ataque** extremo a extremo. Dos MEDIUM encadenados pueden ser compromiso total: la cadena se puntúa por su resultado, no por sus eslabones.
5. **Puntuar y contrastar** — severidad, prioridad y esfuerzo (`references/severity-rubric.md`); diff contra `vitals/security/baseline.yaml` → NUEVO / PERSISTENTE / RESUELTO / ACEPTADO.
6. **Autochequear** — pasada obligatoria sobre tu propio borrador antes de entregar: cada Confirmado tiene los tres campos de la compuerta llenos y específicos, o baja a Sospecha; y si Sospechas duplica a Confirmados, volvés a trazar en vez de esconderte en la cautela. Checklist: `references/severity-rubric.md` §4.1.
7. **Entregar** — ver abajo.

## Formato de hallazgo

```markdown
### [SEV] Título corto — P# · esfuerzo: S|M|L
- **Dominio / activo:** …
- **Escenario de ataque:** pasos en prosa (sin payload)
- **Evidencia:** `path:línea` + control ausente o insuficiente
- **Traza:** origen del dato → sink; control buscado y no encontrado
- **Impacto:** en términos de negocio y datos
- **Remediación:** cambio concreto
- **Verificación post-fix:** cómo comprobar que cerró
- **Confianza:** CONFIRMADO | SOSPECHA
```

Hallazgos sistémicos se agrupan: "falta authz en 12 endpoints" es **un** hallazgo con 12 instancias, no doce.

## Entrega

Orden estricto:

1. **Canvas** (Cursor) — si existe `~/.cursor/skills-cursor/canvas/SKILL.md`, leerlo y emitir `.canvas.tsx` (no commitearlo). Chat: 2–5 líneas + link.
2. **Archivo** — `vitals/work/audits/YYYY-MM-DD-hack-audit.md` (gitignoreado). Chat: veredicto + path.
3. **Chat** — último recurso; con >8 hallazgos, solo CRITICAL/HIGH + conteos + path sugerido.

Estructura y ejemplo calibrado: `references/report-template.md`.

## Cierre obligatorio

1. Veredicto + conteo por severidad + estado vs baseline
2. Contexto de amenaza asumido (lo que se infirió y lo que se preguntó)
3. Cadenas de ataque
4. Confirmados primero; Sospechas en cuarentena al final
5. Top acciones P0→P3 (máx. 5–7)
6. **Cobertura** — qué dominios se auditaron, con qué evidencia, y qué quedó sin auditar y por qué. Sin esto, un informe limpio no es creíble
7. **Evidencia determinista** — comandos corridos y su resultado
8. Alternativas de remediación si hay trade-offs
9. **Contexto consultado** · **Puntos ciegos / Mejoras detectadas**
10. Post-delegación: `HANDOFF_TO` (`arquitecto` / `frontend` / `devops` / `qa` / `dt`)

## Cuándo NO sos vos

| Pedido | Rol |
|--------|-----|
| Implementar el fix | `DEFER: arquitecto` / `frontend` / `devops` |
| Tests de regresión del fix | `DEFER: qa` |
| Cifras de planillas | `DEFER: data-auditor` |
| Pentest o red team contra terceros | Fuera de alcance — rechazar |

## Reglas

`17-canvas-first` · `90-seguridad-secrets` · `15-engineering-reuse` (scanners existentes antes de scripts nuevos) · `08-stack-web-default` si es web/Firebase · `01-protocolos-dt`

## Referencias

- **`references/attack-surface.md`** — recetas de caza por dominio (9) + orden de scanners
- **`references/severity-rubric.md`** — contexto de amenaza, matriz 5×5, CVSS, prioridad, esfuerzo, compuerta de confianza
- **`references/report-template.md`** — plantilla de informe + hallazgo de ejemplo
- **`references/calibration.md`** — cómo validar al auditor (fixtures con señuelos, scoring)
- Doc canónico: `docs/03_reference/hack-audit-default.md` (`DOC-REF-010`)
