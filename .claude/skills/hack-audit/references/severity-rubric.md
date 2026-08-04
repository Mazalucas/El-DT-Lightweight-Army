# Rúbrica de severidad, prioridad y confianza

Fuente única para puntuar hallazgos de `hack-audit`. La severidad **no** se improvisa ni se estima "a ojo": sale de la matriz de abajo, contra el contexto de amenaza establecido en la Fase 0.

---

## 1. Contexto de amenaza (Fase 0, obligatoria)

Sin contexto, la misma debilidad vale un INFO en un prototipo local y un CRITICAL en producción con datos personales. Antes de puntuar, establecer estas cinco variables — inferir del repo lo que se pueda y **preguntar** el resto:

| Variable | Qué establecer |
|----------|----------------|
| **Exposición** | ¿Desplegado y alcanzable desde internet, interno/VPN, o solo local/pre-lanzamiento? |
| **Joyas de la corona** | Los 1–3 activos cuya pérdida dolería de verdad (datos de clientes, credenciales de pago, modelos, código propietario) |
| **Datos sensibles** | PII, salud, pagos, secretos de terceros — ¿existen y dónde viven? |
| **Adversario realista** | Script kiddie oportunista · usuario legítimo abusando · competidor · insider · agente/IA con input no confiable |
| **Blast radius tolerable** | ¿Qué es "sobrevivible" para este proyecto y qué es existencial? |

El contexto asumido se **escribe en el informe**. Si el operador no lo confirma, marcarlo como supuesto explícito.

**Modificador de exposición** (se aplica después de la matriz):

- No desplegado / prototipo local → tope **HIGH** (nada es CRITICAL si no hay superficie viva), salvo secretos de producción vivos.
- Interno / autenticado por VPN → bajar un nivel la probabilidad.
- Público con datos sensibles → sin tope; la probabilidad se evalúa como atacante anónimo.

---

## 2. Matriz de severidad (5×5)

**Impacto**

| Nivel | Significado |
|-------|-------------|
| 1 Insignificante | Sin datos ni disponibilidad afectados; cosmético |
| 2 Menor | Info no sensible, degradación local, alcanza a un usuario |
| 3 Moderado | Datos internos no críticos, abuso de funcionalidad, costo acotado |
| 4 Grave | Datos ajenos o personales, escalada a admin de un tenant, caída del servicio |
| 5 Catastrófico | Compromiso total: RCE, admin global, exfiltración masiva, secreto de prod vivo |

**Probabilidad** (explotabilidad realista en el contexto, no teórica)

| Nivel | Significado |
|-------|-------------|
| 1 Improbable | Requiere insider ya privilegiado o acceso físico |
| 2 Poco probable | Varias precondiciones infrecuentes |
| 3 Posible | Atacante autenticado con esfuerzo moderado |
| 4 Probable | Autenticado con herramientas comunes, o anónimo con esfuerzo |
| 5 Casi seguro | Anónimo, sin herramientas especiales, un request |

**Severidad resultante**

| Prob ↓ / Impacto → | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| **5** | LOW | MEDIUM | HIGH | CRITICAL | CRITICAL |
| **4** | LOW | MEDIUM | HIGH | HIGH | CRITICAL |
| **3** | INFO | LOW | MEDIUM | HIGH | HIGH |
| **2** | INFO | LOW | LOW | MEDIUM | HIGH |
| **1** | INFO | INFO | LOW | LOW | MEDIUM |

Cada hallazgo declara `impacto=N, probabilidad=N` para que la etiqueta sea auditable y discutible.

**CVSS 3.1:** obligatorio solo en **CRITICAL y HIGH**, citando el vector completo (`CVSS:3.1/AV:N/AC:L/...`). En MEDIUM y abajo agrega ceremonia sin señal: alcanza la matriz.

---

## 3. Prioridad (cuándo se toca)

La severidad describe *qué tan grave es*; la prioridad, *en qué orden se arregla*. Son ejes distintos: un CRITICAL que exige migración de arquitectura puede necesitar una mitigación P0 y un fix definitivo P2.

| Prioridad | Criterio |
|-----------|----------|
| **P0** — hoy | CRITICAL, o HIGH con probabilidad ≥ 4 en entorno expuesto |
| **P1** — esta semana | HIGH restantes; MEDIUM con esfuerzo S (quick win) |
| **P2** — próximo sprint | MEDIUM; mitigaciones definitivas de deuda estructural |
| **P3** — backlog | LOW, INFO, hardening y defensa en profundidad |

**Esfuerzo:** `S` (< 1 h, 1 archivo) · `M` (medio día, varios archivos) · `L` (> 1 día, cambio de diseño, migración o coordinación).

---

## 4. Compuerta de confianza (anti-alucinación)

El modo de falla número uno de una auditoría hecha por IA es el patrón sin traza: ver `dangerouslySetInnerHTML` y cantar XSS sin comprobar que entra input no confiable ni que falta el sanitizador.

Un hallazgo es **CONFIRMADO** solo si se cumplen las tres:

1. **Origen identificado** — de dónde viene el dato controlado por el atacante (`path:línea`).
2. **Sink identificado** — dónde se usa sin control (`path:línea`).
3. **Control ausente, habiéndolo buscado** — se nombran los controles candidatos que se revisaron y por qué no cubren el caso.

Si falta cualquiera → **SOSPECHA**. Reglas duras para sospechas:

- Tope **MEDIUM**, sin excepciones.
- Van en sección aparte al final, nunca mezcladas con los confirmados.
- No pueden ocupar lugar en Top acciones P0.
- Se entregan como **pregunta verificable**, no como afirmación ("no pude confirmar si X valida Y — revisar").

**Controles a buscar antes de afirmar**, por clase:

| Clase | Control que hay que descartar primero |
|-------|----------------------------------------|
| XSS | Autoescape del framework, sanitizador, CSP |
| IDOR / authz | Middleware de ownership, security rules, filtro por tenant en la query |
| Injection | ORM/consulta parametrizada, allowlist |
| SSRF | Allowlist de destinos, egress restringido |
| Secreto expuesto | ¿Es placeholder? ¿Está rotado? ¿Es de un servicio de juguete? |
| Falta rate limit | WAF, límite del gateway, cuota del proveedor |

---

## 4.1 Autochequeo antes de entregar (obligatorio)

La compuerta falla en **dos** direcciones. Una es obvia: colar sospechas como confirmados. La otra aparece justo cuando la regla es dura: **sobrecorregir** y mandar todo a Sospechas, entregando un informe cobarde que no compromete nada y no sirve para decidir. Antes de entregar, pasada mecánica sobre el propio borrador:

**Por cada Confirmado:**

- [ ] ¿El campo **origen** nombra un `path:línea` concreto, o es una generalidad ("input del usuario")? Sin path → Sospecha.
- [ ] ¿El campo **sink** nombra `path:línea`? Sin path → Sospecha.
- [ ] ¿Los **controles descartados** están nombrados uno por uno con el motivo por el que no cubren el caso? "No hay validación" sin decir qué se revisó no cuenta → Sospecha.
- [ ] ¿La severidad declara `impacto=N, probabilidad=N` y coincide con la matriz? Si no coincide, corregir la etiqueta, no la matriz.
- [ ] ¿CVSS presente si es CRITICAL o HIGH?

**Sobre el conjunto:**

- [ ] Si `Sospechas > 2 × Confirmados`: señal de cautela excesiva. Volver a trazar las 3 sospechas de mayor impacto antes de entregar; si tras el intento siguen sin traza, dejarlas y **decirlo en Cobertura** (que no se pudo trazar es un dato del informe, no una excusa silenciosa).
- [ ] Si hay **cero** Confirmados: verificar que sea un resultado real y no evasión. Un informe sin confirmados es válido, pero exige declarar explícitamente qué se revisó para llegar a esa conclusión.
- [ ] ¿Cada Sospecha está redactada como **pregunta verificable** con su método de verificación?
- [ ] ¿Los hallazgos que comparten causa raíz están agrupados en uno con instancias?

**Nunca** resolver un empate inflando severidad para que el informe "pese más". La credibilidad del auditor es el activo.

---

## 5. Clasificación de secretos (tipo × estado)

Marcar todo secreto como CRITICAL inunda el informe y quema credibilidad. Clasificar:

| Estado | Credencial de prod viva | No-prod viva (staging/dev) | Rotada / revocada | Placeholder / ejemplo |
|--------|------------------------|----------------------------|-------------------|----------------------|
| En working tree | CRITICAL | HIGH | LOW | INFO |
| Solo en historial Git | CRITICAL | HIGH | LOW (limpieza) | — |
| Expuesta al bundle de cliente | CRITICAL | HIGH | LOW | INFO |

Reglas: nunca pegar el valor (redactar); el hallazgo siempre incluye **rotar** además de **quitar** — borrar del código sin rotar no cierra nada; si está en el historial, la remediación incluye purga o aceptación explícita del riesgo.

---

## 6. Estado vs baseline

Contra `vitals/security/baseline.yaml`:

| Estado | Significado |
|--------|-------------|
| **NUEVO** | No estaba en la auditoría anterior — es la sección que más importa |
| **PERSISTENTE** | Ya reportado y sigue abierto (indicar desde cuándo) |
| **RESUELTO** | Estaba y ya no se reproduce — confirmar y proponer bajarlo del registro |
| **ACEPTADO** | Riesgo aceptado con dueño y fecha; se lista aparte y no cuenta en el veredicto |
