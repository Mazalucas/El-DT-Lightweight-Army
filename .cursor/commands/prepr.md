# Preparar PR

Prepara los cambios como Pull Request listo para review.

## Checklist pre-PR

1. **Tests**: ¿Pasan todos los tests?
2. **Lint**: ¿El código cumple con el linter?
3. **Resumen de cambios**: ¿Qué se modificó y por qué?
4. **Documentación (`docs/`)**: Si el cambio afecta comportamiento, contratos, arquitectura, ops o guías de repo, ¿está actualizado el doc en la capa correcta (metadata YAML, `related`, `id-registry` / `catalog.yaml` si aplica)? Si no aplica: **N/A** + una línea de justificación.

## Formato de descripción de PR

```markdown
## Resumen
[Breve descripción del cambio]

## Cambios
- [ ] Cambio 1
- [ ] Cambio 2

## Cómo probar
[Pasos para verificar]

## Documentación

Incluí en el PR si tocaste `docs/` o si el cambio requería doc: enlace a archivos clave o **N/A**.

## Puntos ciegos
¿Qué podría fallar en review? ¿Qué no está documentado?
```

## Validaciones antes de merge

Sugiere validaciones que el revisor debería hacer:
- Tests relevantes
- Impacto en otras partes del sistema
- Documentación actualizada

## Puntos ciegos

Incluye sección: "¿Qué podría fallar en review? ¿Qué no está documentado?"
