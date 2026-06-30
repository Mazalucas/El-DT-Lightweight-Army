---
description: Orden continuo - loop autónomo siempre activo que verifica y corrige el orden con dt-doctor
alwaysApply: true
---

# Orden continuo (loop autónomo siempre activo)

El mayor talento del DT es **ordenar**. Esta regla convierte ese talento en un **loop autónomo** que corre sin que el usuario lo pida: tras cualquier cambio sustantivo, el DT verifica el orden y lo corrige hasta dejarlo en verde.

## Cuándo se dispara (siempre activo)

Al cerrar cualquier cambio que toque `docs/`, reglas, commands, skills, `vitals/specs/`, `vitals/config/` o la estructura del repo. No requiere `/orquestar` ni pedido explícito: es parte de la entrega.

## Definición de "orden cumplido" (DoD)

El orden está en verde cuando se cumple **todo** lo siguiente:

1. **Frontmatter completo** en todo `.md` nuevo/editado bajo `docs/` (campos mínimos de `DOC-META-001 §5.1`).
2. **Doc en la capa correcta** según la tabla "qué cambió → dónde se documenta" de la regla `02-documentacion`.
3. **Catálogo sincronizado**: `docs/99_meta/catalog.yaml` derivado del frontmatter (sin docs huérfanos ni entradas muertas).
4. **IDs sin colisión** y prefijos registrados en `docs/99_meta/id-registry.md`.
5. **Enlaces internos válidos** (sin rutas rotas).
6. **Paridad multi-IDE**: reglas, commands y skills coherentes entre todos los targets de `vitals/config/ide-targets.yaml`.
7. **Telemetría fresca**: si cambió normativa del DT o `VERSION`, `vitals/pulse/current.md` refleja el último estado.

## El loop

```text
1. Ejecutar el cambio pedido.
2. Correr el verificador:  ./scripts/dt-doctor.sh
3. ¿Orden en verde (exit 0)?
   - Sí  → entregar resumen y cerrar.
   - No  → para cada hallazgo que NO toque el gate duro: corregir
            (regenerar catálogo/reglas/skills, completar frontmatter,
             arreglar enlaces, refrescar pulse) y volver al paso 2.
4. Si un hallazgo toca el gate duro (seguridad/secretos o irreversible
   de FS/Git) → detener ese ítem, pedir confirmación humana y seguir
   con el resto.
```

## Condiciones de corte (anti-loop infinito)

- **Tope de iteraciones:** máximo 5 vueltas del loop por entrega.
- **No-progreso:** si una corrección no reduce la cantidad de hallazgos de `dt-doctor`, frenar y reportar el hallazgo persistente en "Puntos ciegos".
- **Freno de emergencia:** si el usuario escribe `stop` / `pará` / `basta`, abortar el loop de inmediato.
- Al frenar sin llegar a verde, **entregar igual** con la lista explícita de lo que quedó pendiente.

## Gate duro (única excepción a la autonomía)

Bajo autonomía total el loop ejecuta y corrige sin preguntar, **excepto**:

- **Seguridad/secretos:** nunca commitear ni exponer `.env`, credenciales o tokens. Inviolable.
- **Irreversibles de FS/Git:** soltar remoto, mover el repo a la raíz, borrado destructivo de carpetas IDE, `push --force`. Requieren dry-run + confirmación explícita + working tree limpio.

Precedencia completa: `vitals/specs/precedence.md`.

## Herramientas del loop

- `./scripts/dt-doctor.sh` — verificador read-only (motor del loop).
- `ruby scripts/sync-catalog.rb` — regenera catálogo / próximo ID libre.
- `./scripts/sync-ide.sh` — regenera reglas/skills/punteros de todos los IDEs.
- `./scripts/sync-commands-from-meta.sh` — regenera commands.
