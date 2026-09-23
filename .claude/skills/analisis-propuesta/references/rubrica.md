# Rúbrica — panel `/analisis-propuesta`

Cada panelista lee este archivo y responde **solo** con el esquema de salida al final. Justificar cada juicio; no afirmar que el plan **garantiza** el objetivo.

## Dimensiones (definiciones fijas)

| Dimensión | Pregunta | Definición |
|-----------|----------|------------|
| **Cumple el objetivo** | ¿El plan logra el objetivo **declarado**? | Solo el objetivo congelado en el brief, no uno más amplio ni un subconjunto disfrazado de éxito. |
| **Approach correcto** | ¿Es el camino adecuado frente a alternativas **reales**? | Comparar con al menos una alternativa concreta (no una versión caricaturizada del plan). |
| **Escalable** | ¿Sigue siendo válido al crecer? | Volumen, equipo, casos límite o datos — sin rediseño completo del approach. |
| **Óptimo** | ¿Es razonablemente eficiente entre los que cumplen? | Menor costo, complejidad y pasos irreversibles; **no** significa el plan más ambicioso. |
| **Replicable** | ¿Otro operador puede repetir el resultado? | Mismas restricciones, otro momento; pasos y criterios de éxito explícitos. |

Por dimensión: juicio `fuerte` | `parcial` | `débil` | `no_evaluable` + 1–3 frases de justificación.

## Recomendación final (una sola)

| Valor | Cuándo |
|-------|--------|
| `adoptar` | Las cinco dimensiones son `fuerte` o `parcial` aceptable; riesgos residuales listados y acotados. |
| `adoptar_con_cambios` | El approach es correcto pero faltan cambios concretos antes de ejecutar. |
| `rechazar` | El plan no cumple el objetivo o el approach es incorrecto; reformular desde cero. |
| `reformular` | El objetivo es válido pero el plan actual no es el vehículo adecuado (cambio de estrategia, no de tuning). |

## Propuesta superadora

Solo si **gana en las dimensiones relevantes sin cambiar el objetivo declarado**. Si resuelve un problema distinto → etiquetar como **otro objetivo**, no como reemplazo del plan evaluado.

Incluir: qué cambia, por qué es mejor, trade-offs, y qué evidencia faltaría para adoptarla con confianza.

## Condiciones de fallo (obligatorio)

Lista de supuestos que, si fueran falsos, harían fallar el plan. **No** usar un porcentaje de éxito como hecho. Si se estima probabilidad, marcar `DERIVADO` (regla `16`) y explicar el razonamiento.

## Esquema de salida (Ronda 1 y Ronda 2)

```markdown
## Panelista — {model_slug}

### Objetivo entendido
(1–2 frases; si difiere del brief, decirlo)

### Juicio por dimensión
- Cumple el objetivo: {fuerte|parcial|débil|no_evaluable} — …
- Approach correcto: …
- Escalable: …
- Óptimo: …
- Replicable: …

### Alternativas consideradas
- A: … (pros/contras vs plan)
- B: … (si aplica)

### Supuestos críticos
- …

### Puntos ciegos
- …

### Cuidados antes de ejecutar
- …

### Evidencia faltante
- …

### Propuesta superadora (si aplica)
- …

### Condiciones de fallo
- Si X es falso → …

### Recomendación
`adoptar` | `adoptar_con_cambios` | `rechazar` | `reformular` — justificación en 2–4 frases.

### Ronda 2 (solo en segunda pasada)
- Coincido con {modelo}: …
- Rechazo idea de {modelo}: …
- Adopté de {modelo}: …
- Cambio de recomendación: sí/no — por qué
```

## Síntesis del panel (solo quien redacta el cierre)

```markdown
## Síntesis del panel

### Consenso
- …

### Disenso (obligatorio si existe)
- {modelo}: … vs {modelo}: …

### Recomendación integrada
Una de las cuatro etiquetas + plan de acción en viñetas (cambios obligatorios vs opcionales).

### Cuidados compartidos
- …

### Límite del método
Los panelistas pueden compartir el mismo punto ciego; consenso ≠ garantía.
```
