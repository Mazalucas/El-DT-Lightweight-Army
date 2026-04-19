---
description: Preparar cambios como Pull Request listo para review - Checklist, descripción, validaciones
---

# Preparar PR

Prepara los cambios como Pull Request listo para review.

1. **Checklist pre-PR**: ¿Pasan todos los tests? ¿El código cumple con el linter? ¿Hay resumen de cambios?

2. **Documentación (`docs/`)**: ¿Los cambios de producto, API, arquitectura, ops o flujo de trabajo quedaron reflejados en la capa correcta bajo `docs/` con frontmatter y enlaces, según `docs/99_meta/protocolo-documentacion-ia.md`? Si no aplica, declarar explícitamente **N/A** con una línea de justificación.

3. **Formato de descripción de PR**: Incluir Resumen, Cambios (lista), Cómo probar, Puntos ciegos (y línea de documentación o N/A).

4. **Validaciones antes de merge**: Sugerir validaciones que el revisor debería hacer (tests relevantes, impacto en otras partes, coherencia de documentación e IDs si tocó `docs/`).

5. **Puntos ciegos**: Incluir sección "¿Qué podría fallar en review? ¿Qué no está documentado?"
