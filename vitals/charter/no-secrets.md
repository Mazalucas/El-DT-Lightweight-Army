# Charter — no secretos en Vitals

## Regla

**Prohibido** almacenar en `vitals/` (incluidos `pulse/`, `memory/`, `specs/`):

- API keys, tokens, contraseñas, certificados privados
- Contenido de `.env` o Firebase secrets
- Datos personales identificables innecesarios para el log

## Qué hacer en su lugar

- Referenciar **nombre** de variable o **tipo** de secreto, nunca el valor.
- Usar `REDACTED` o “valor en gestor de secretos del equipo”.

## Revisión

Si un pulso o propuesta de memoria podría contener filtración, **no commitear**; rotar credencial si ya se filtró y reescribir el entry.
