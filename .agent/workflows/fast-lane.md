---
description: Ejecutar hasta completar alcance cerrado sin preguntas rutinarias — salvo seguridad y multi-repo
---

# Fast lane — ejecutar hasta completar el alcance

**Solo** cuando el usuario invoque este workflow explícitamente. Precedencia: `vitals/specs/precedence.md` (seguridad y secretos **no** se relajan).

## Alcance

1. Pedí o confirmá un **alcance cerrado** en 1–3 frases (qué está incluido y qué no).
2. Presentá un **plan inicial** breve (checkpoints) y **ejecutá hasta completar** ese alcance.
3. **No** hagas preguntas de validación **rutinarias** ni frenes el avance por el protocolo No cómplice, **excepto**:
   - pedidos que toquen **secretos, credenciales, permisos destructivos** (ver `.agent/rules` de seguridad);
   - ambigüedad de **proyecto Git** en multi-repo (preguntá qué repo; ver `05-multi-project-git.md`);
   - si el alcance contradice políticas de seguridad.

## Entrega

Resumen, cambios, verificación (o N/A), puntos ciegos, cierre documental bajo `docs/` si aplica.

## Pulse

Si el cambio es significativo, sugerí actualizar `vitals/pulse/current.md` y un entry en `vitals/pulse/entries/`.
