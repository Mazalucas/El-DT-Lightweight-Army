# Confianza numérica (numeric grounding)

Fuente humana: `docs/03_reference/numeric-verification-default.md` (`DOC-REF-009`). Skill operativa: `.cursor/skills/data-auditor/SKILL.md`. Subagente: **data-auditor**. Command: `/verificar`.

## Cuándo aplica

**Siempre** que la entrega incluya cifras derivadas de datos del usuario o del repo: sumas, promedios, porcentajes, totales, conteos, variaciones, proyecciones, reconciliaciones. Fuentes típicas: planillas (CSV/XLSX/TSV), reportes, tablas pegadas en el chat, exports de sistemas, dashboards.

**No aplica** a: números literales citados de una fuente sin transformación (citar la fuente), ejemplos ilustrativos marcados como tales, versiones/IDs/números de línea.

## Regla de oro

**La IA no calcula mentalmente.** Todo cálculo sobre datos reales se ejecuta con código (script Python/Node u otra herramienta determinista) y se reporta el output real del script. Prohibido "estimar" un total leyendo una columna, por trivial que parezca.

## Etiquetas de procedencia (obligatorias en tareas cuantitativas)

| Etiqueta | Significado |
|---|---|
| `[VERIFICADO]` | Salió de un script ejecutado en esta sesión; comando y output reproducibles |
| `[DERIVADO]` | Calculado a partir de cifras verificadas; la fórmula queda a la vista |
| `[NO VERIFICADO]` | Citado de una fuente sin recomputar, o sin runtime disponible para verificar |

Prohibido entregar cifras sin etiqueta cuando la tarea es cuantitativa.

## Cross-checks mínimos

- **Total vs. suma de partes** — si hay fila/columna de totales, recomputarla y comparar.
- **Conteo de filas** — filas leídas vs. esperadas; detectar headers duplicados, filas vacías, duplicados.
- **Tipos y unidades** — moneda, separadores de miles/decimales, porcentajes, fechas; declarar la interpretación asumida.
- **Discrepancias se reportan, nunca se "acomodan"** — si los números no cierran, ese es el hallazgo principal de la entrega.

## Modo degradado (sin runtime)

No asumir runtime: detectar qué hay disponible (`python3` con pandas > `python3` stdlib > `node`). Si **no hay ninguno**:

1. No fingir verificación.
2. Etiquetar todo como `[NO VERIFICADO]` con advertencia explícita al inicio de la entrega.
3. Entregar el script listo para que el usuario lo corra donde sí haya runtime.

## Anti-alucinación de cifras

- **Nunca inventar** cifras faltantes ni completar celdas vacías con supuestos silenciosos — los vacíos se reportan como vacíos.
- **No redondear en silencio** — declarar la regla de redondeo (decimales, dirección).
- Si el dato no está en la fuente, la respuesta es "no está en la fuente", no una estimación disfrazada de dato.

## Entregable obligatorio (tareas cuantitativas)

Cerrar con sección **Verificación numérica**:

```markdown
## Verificación numérica
- Fuente de datos: [archivo/tabla + filas leídas]
- Script ejecutado: [comando reproducible o path]
- Checks: [total vs partes ✓/✗, conteo filas ✓/✗, unidades ✓/✗]
- Cifras: [VERIFICADO: n] [DERIVADO: n] [NO VERIFICADO: n]
```

## Al delegar

Incluir el **Bloque verificación numérica** (ver `03-catalogo-subagentes`) al delegar tareas con cifras a `data-auditor`, `qa`, `arquitecto`, `researcher`, `marketing-strategist` o afines.
