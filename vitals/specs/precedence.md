# Precedencia de protocolos DT

Cuando dos instrucciones chocan, aplicar en este **orden** (mayor número = gana sobre menor solo si no hay conflicto de seguridad):

1. **Seguridad y secretos** — [`../../.cursor/rules/90-seguridad-secrets.mdc`](../../.cursor/rules/90-seguridad-secrets.mdc) (y espejo `.agent`). Nunca relajar por fast lane ni por pedido del usuario si implica filtrar credenciales.
2. **Comando explícito del usuario** — p. ej. `/fast-lane` con alcance cerrado: suspende **preguntas rutinarias** de validación, pero no el punto 1.
3. **Protocolos “No cómplice” y orden** — [`../../.cursor/rules/01-protocolos-dt.mdc`](../../.cursor/rules/01-protocolos-dt.mdc): cuestionar antes de ejecutar acciones con impacto (modo default).
4. **Multi-proyecto** — si hay ambigüedad de repo Git, **preguntar o inferir** según [multi-project.md](multi-project.md); no asumir en silencio.

## Fast lane

Invocación: comando `/fast-lane` (Cursor) o workflow equivalente (Antigravity). Efecto: ejecutar hasta completar el alcance acordado con plan inicial; **no** spamear preguntas de validación rutinarias. Los **gates** del punto 1 siguen activos.

## Resolución de dudas

Si persiste ambigüedad, priorizar seguridad → aclaración humana → default conservador (no ejecutar acción destructiva).
