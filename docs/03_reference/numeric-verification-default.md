---
id: DOC-REF-009
title: Confianza numérica del DT (numeric grounding)
type: reference
status: canonical
owner: dt-platform
created: 2026-07-02
updated: 2026-07-02
tags:
  - data
  - verification
  - numeric
  - trust
domain:
  - reference
summary: Protocolo de confianza numérica — la IA nunca calcula mentalmente; todo número sale de un script ejecutado, con etiquetas de procedencia y cross-checks.
related:
  - DOC-REF-006
  - DOC-META-001
priority: high
intended_audience:
  - engineers
  - ai-agents
source_of_truth: true
review_cycle_days: 90
---

# Confianza numérica del DT (numeric grounding)

Referencia humana del protocolo de **confianza numérica**: cómo el DT y sus subagentes manejan planillas, reportes y cualquier pedido de "sacar números" sin alucinar cifras. Fuente machine-readable: regla `16-numeric-grounding` · skill `.cursor/skills/data-auditor/`.

## Por qué existe

Los LLMs se equivocan al sumar "de memoria" y el error es silencioso: el resultado parece plausible. La defensa es estructural, no de prompt: **el cálculo se desplaza de la IA a código ejecutado**, y la IA solo orquesta, verifica y reporta.

## Regla de oro

Todo cálculo sobre datos reales (sumas, promedios, porcentajes, totales, conteos) se ejecuta con script determinista (Python/pandas preferido, Python stdlib o Node como fallback). Prohibido el cálculo mental del modelo, por trivial que parezca la operación.

## Etiquetas de procedencia

| Etiqueta | Significado |
|----------|-------------|
| `[VERIFICADO]` | Output real de un script ejecutado en la sesión, reproducible |
| `[DERIVADO]` | Calculado desde cifras verificadas, fórmula a la vista |
| `[NO VERIFICADO]` | Citado sin recomputar, o sin runtime disponible |

En tareas cuantitativas, ninguna cifra se entrega sin etiqueta.

## Cross-checks mínimos

1. **Total vs suma de partes** — recomputar totales declarados en la fuente.
2. **Conteo de filas** — leídas vs esperadas; headers duplicados, vacíos, duplicados.
3. **Tipos y unidades** — separadores decimales, monedas, porcentajes, fechas; declarar interpretación.
4. **Discrepancias se reportan** — nunca se "acomodan" para que cierre.

## Modo degradado (sin runtime)

No se asume runtime. Detección: `python3` + pandas > `python3` stdlib > `node`. Si no hay ninguno: advertencia explícita, todo `[NO VERIFICADO]`, y se entrega el script listo para que el usuario lo corra en un entorno con runtime. Nunca fingir verificación.

## Entregable obligatorio

```markdown
## Verificación numérica
- Fuente de datos: [archivo/tabla + filas leídas]
- Script ejecutado: [comando reproducible o path]
- Checks: [total vs partes ✓/✗, conteo filas ✓/✗, unidades ✓/✗]
- Cifras: [VERIFICADO: n] [DERIVADO: n] [NO VERIFICADO: n]
```

## Piezas del stack

| Artefacto | Ubicación |
|-----------|-----------|
| Regla always-on | `vitals/specs/rule-bodies/16-numeric-grounding.body.md` |
| Skill operativa | `.cursor/skills/data-auditor/SKILL.md` |
| Recetas por runtime | `.cursor/skills/data-auditor/references/verify-recipes.md` |
| Tool reutilizable | `tools/data/verify-csv.py` (stdlib; perfil, sumas Decimal, `--assert-total`, exit 2 en discrepancia) |
| Subagente | `.cursor/agents/data-auditor.md` (especialista #22) |
| Command | `/verificar` (`vitals/config/commands-meta.yaml`) |

## Delegación desde el DT

Al delegar tareas con cifras, incluir el **Bloque verificación numérica** (ver regla `03-catalogo-subagentes`):

```text
Bloque verificación numérica:
- Regla: 16-numeric-grounding (nunca calcular mentalmente)
- Todo cálculo con script ejecutado; etiquetas [VERIFICADO]/[DERIVADO]/[NO VERIFICADO]
- Cross-checks: total vs partes, conteo de filas, unidades
- Entregar sección "Verificación numérica"
```

## Related docs

- [Ingeniería reuse-first](engineering-reuse-default.md) (`DOC-REF-006`) — reutilizar scripts de verificación existentes antes de crear nuevos
- [Protocolo documentación IA](../99_meta/protocolo-documentacion-ia.md) (`DOC-META-001`)
