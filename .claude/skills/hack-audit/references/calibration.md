# Calibración del auditor

Cómo comprobar que `hack-audit` funciona, en vez de suponerlo. La rúbrica y la compuerta son instrucciones: hasta que no se ejercitan contra un caso con respuesta conocida, no se sabe si el auditor las respeta.

Correr esto **al crear la skill, al tocar la rúbrica o la compuerta, y al cambiar de modelo base**.

---

## 1. Banco de pruebas

```bash
./tools/security/make-fixtures.sh          # genera output/hack-audit-fixtures/ (gitignoreado)
```

Contiene **7 vulnerabilidades plantadas** y **5 señuelos** (patrones que parecen vulnerables pero tienen un control que los cubre). La clave de respuestas está en `ANSWERS.md`, fuera de `app/`.

**Reglas de la prueba:**

- Auditar **solo** `output/hack-audit-fixtures/app`.
- No leer `ANSWERS.md` antes de entregar el informe: leerla invalida la corrida.
- Al terminar: `./tools/security/make-fixtures.sh --clean`.

Encontrar las plantadas es la parte fácil. Lo que mide de verdad la compuerta anti-alucinación es **descartar los señuelos**, en especial `D5` (ruta sin chequeo inline cuya autenticación se aplica globalmente en `server.js`): confirmarlo como hallazgo significa que el auditor no buscó el control aguas arriba.

---

## 2. Las cuatro métricas

| Métrica | Cómo se mide | Aprueba con |
|---------|--------------|-------------|
| **Detección** | Plantadas reportadas como Confirmadas / 7 | ≥ 6 |
| **Precisión** | Señuelos **no** reportados como Confirmados / 5 | 5 (cero tolerancia) |
| **Calibración** | Severidades dentro de **un nivel** de la esperada | ≥ 6 de 7 |
| **Disciplina de compuerta** | Confirmados con origen, sink y controles descartados, los tres con `path:línea` | 100 % |

Un señuelo reportado como **Sospecha** con su pregunta verificable **no** cuenta como error: es el comportamiento correcto cuando falta traza. Solo cuenta como fallo si se afirma como Confirmado.

---

## 3. Las dos trampas del banco

**Trampa A — razonar, no solo leer el scanner.** `tools/security/scan-repo.sh` detecta 5 de las 7 plantadas. Las otras dos (**V1**, IDOR por `req.params.id` sin filtro de dueño, y **V3**, denial-of-wallet en el endpoint del modelo) **no son detectables por patrón**. Si el informe contiene exactamente las señales del scanner y nada más, el auditor no está auditando: está transcribiendo.

**Trampa B — no sobrecorregir.** El fallo opuesto a inventar vulnerabilidades es esconderse: mandar todo a Sospechas y no comprometerse con nada. Un informe con menos de 4 Confirmados sobre este banco es tan malo como uno que confirma señuelos, porque en la práctica no permite decidir qué arreglar.

También conviene mirar si aparecieron **cadenas de ataque**: el banco permite al menos una (credencial embebida en `config/aws.js` + reglas abiertas en `users` = lectura y escritura de datos personales sin cuenta). Un informe que lista los siete hallazgos sueltos sin encadenar ninguno cumple la forma pero pierde lo que distingue a esta skill.

---

## 4. Registro del resultado

La calibración no sirve si se re-discute cada vez. Al terminar, anotar en el pulse (`vitals/pulse/entries/`) una línea con: fecha, modelo usado, y las cuatro métricas.

`vitals/security/baseline.yaml` es para el riesgo del **proyecto**, no para la calidad del auditor: no mezclar.

---

## 5. Validación con un proyecto real

El banco es sintético y por lo tanto optimista: los archivos son cortos y las señales están cerca. Complementar con una corrida sobre un proyecto propio con backend real y verificación humana de 3–5 hallazgos, mirando dos cosas que el banco no puede medir:

- **Realismo de la severidad** — ¿el contexto de amenaza de la Fase 0 cambió las notas respecto de puntuar a ciegas?
- **Costo de triage** — ¿cuánto tardó una persona en confirmar o descartar cada hallazgo? Si descartar cuesta más que encontrar, el informe tiene demasiadas sospechas.
