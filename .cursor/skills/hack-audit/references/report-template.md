# Plantilla de informe — Hack Audit

Para el canvas (equivalente visual) o para `vitals/work/audits/YYYY-MM-DD-hack-audit.md` (gitignoreado — no commitear).

---

## Plantilla

```markdown
# Hack Audit — {proyecto}

| | |
|---|---|
| **Fecha** | {YYYY-MM-DD} |
| **Alcance** | full · {dominio} · diff |
| **Base (si diff)** | {branch/SHA} |
| **Estrategia** | pasada única · fan-out por dominio |
| **Veredicto** | {1–3 líneas: lo que un CTO necesita saber en 10 segundos} |

## Contexto de amenaza asumido

| Variable | Valor | Fuente |
|---|---|---|
| Exposición | {prod público · interno · local} | {inferido de … · confirmado por el operador} |
| Joyas de la corona | … | … |
| Datos sensibles | … | … |
| Adversario realista | … | … |

## Conteos

| Severidad | Confirmados | Sospechas | vs baseline |
|---|---|---|---|
| CRITICAL | N | — | {N nuevos} |
| HIGH | N | — | … |
| MEDIUM | N | N | … |
| LOW | N | N | … |
| INFO | N | N | … |

## Cadenas de ataque

### Cadena 1 — {resultado: p. ej. "de anónimo a lectura de toda la base"}
1. {hallazgo A} permite …
2. combinado con {hallazgo B} habilita …
3. resultado: {blast radius}

**Severidad de la cadena:** {puede exceder la de sus eslabones}

## Hallazgos confirmados

### [SEV] Título — P# · esfuerzo: S|M|L · {NUEVO|PERSISTENTE}
- **Impacto/Probabilidad:** {N}/{N} → {SEV} · CVSS {si CRITICAL o HIGH}
- **Dominio / activo:** …
- **Escenario de ataque:** …
- **Evidencia:** `path:línea` …
- **Traza:** origen → sink; controles revisados y descartados
- **Impacto:** …
- **Remediación:** …
- **Verificación post-fix:** …
- **Instancias:** {si es sistémico, listar paths}

## Sospechas (sin confirmar — tope MEDIUM)

### [SEV] Título — pregunta verificable
- **Qué no pude confirmar:** …
- **Cómo verificarlo:** …

## Riesgos aceptados (baseline)

| Hallazgo | Dueño | Desde | Motivo |
|---|---|---|---|

## Top acciones (P0 → P3)

1. …

## Cobertura

| Dominio | Auditado | Evidencia | Notas |
|---|---|---|---|
| auth | sí/no/parcial | scanner + lectura | … |

**No auditado y por qué:** …

## Evidencia determinista

| Comando | Resultado |
|---|---|
| `tools/security/scan-repo.sh` | {resumen} |

## Alternativas de remediación

- Opción A — … (pros/contras)
- Opción B — …

## Contexto consultado

- …

## Puntos ciegos / Mejoras detectadas

- …
```

---

## Hallazgo de ejemplo (calibración)

Este es el nivel de detalle y anclaje esperado. Copiar el rigor, no el contenido.

```markdown
### [HIGH] Los perfiles de usuario son legibles por cualquier autenticado — P1 · esfuerzo: S · NUEVO
- **Impacto/Probabilidad:** 4/4 → HIGH · CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N (7.7)
- **Dominio / activo:** authz · colección `users` (Firestore)
- **Escenario de ataque:** cualquier persona que complete el registro obtiene un token válido.
  Con ese token puede leer documentos de `users/{uid}` distintos del propio, iterando UIDs
  obtenidos de los avatares públicos del feed. No requiere herramientas especiales.
- **Evidencia:** `firestore.rules:14` — `allow read: if request.auth != null;` sobre
  `match /users/{userId}`. La condición valida *autenticación*, no *pertenencia*.
- **Traza:** origen = `userId` del path, controlado por el cliente → sink = lectura del documento.
  Controles revisados y descartados: no hay `request.auth.uid == userId` en la regla; el cliente
  filtra en `useProfile.ts:31` pero es filtrado de UI, sin efecto en el servidor; no hay App Check.
- **Impacto:** el documento incluye email y teléfono → exposición de datos personales de toda la
  base a cualquier cuenta recién creada. Riesgo regulatorio además del reputacional.
- **Remediación:** `allow read: if request.auth.uid == userId;` y mover los campos que sí son
  públicos (nombre, avatar) a `publicProfiles/{userId}`.
- **Verificación post-fix:** test de reglas con dos UIDs (propio → permitido, ajeno → denegado)
  en el emulador; agregar el caso a la suite para que no vuelva a abrirse.
- **Instancias:** `users`, y el mismo patrón en `orders` (`firestore.rules:29`).
```

Contraste — la misma observación **sin** traza es una sospecha, no un HIGH:

```markdown
### [MEDIUM] Posible lectura cruzada en `orders` — pregunta verificable
- **Qué no pude confirmar:** la regla delega en `isMember()`, cuya definición no está en el repo
  (¿viene de un include o de otra rama?). No pude verificar si compara el tenant del documento.
- **Cómo verificarlo:** localizar la definición de `isMember()` y correr el test del emulador con
  dos tenants distintos.
```

---

## Canvas (Cursor)

- Header: proyecto, veredicto, alcance, contexto de amenaza en una línea
- KPI row: conteos por severidad + cuántos son NUEVOS
- Cadenas de ataque como bloque destacado (es la sección de mayor valor)
- Tabla filtrable: SEV · P# · esfuerzo · estado vs baseline · título · path
- Sospechas en una pestaña o sección visualmente separada
- Footer: cobertura, evidencia determinista, ciegos

Chat: veredicto + link al canvas (o path del `.md`). No commitear el `.canvas.tsx`.
