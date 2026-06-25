# Precedencia de protocolos DT

Cuando dos instrucciones chocan, aplicar en este **orden** (mayor número = gana sobre menor solo si no hay conflicto de seguridad):

1. **Gate duro: seguridad, secretos e irreversibles** — [`../../.cursor/rules/90-seguridad-secrets.mdc`](../../.cursor/rules/90-seguridad-secrets.mdc) (y espejo `.agent`). Nunca relajar por fast lane, por modo autónomo ni por pedido del usuario si implica filtrar credenciales. Incluye operaciones **irreversibles** de FS/Git (soltar remoto, mover el repo a la raíz, borrado destructivo de carpetas IDE, `push --force`): requieren dry-run + confirmación explícita + working tree limpio.
2. **Stack web (soft default)** — [`../../.cursor/rules/08-stack-web-default.mdc`](../../.cursor/rules/08-stack-web-default.mdc): opt-out explícito del usuario > stack del repo existente > `.agents/engineering-stack.md` > `vitals/data/engineering/web-stack.yaml`. Preferencia, no gate duro; no empujar migración.
3. **Comando explícito del usuario / modo autónomo** — p. ej. `/fast-lane` con alcance cerrado o el loop de [`07-orden-continuo`](../../.cursor/rules/07-orden-continuo.mdc): suspende **preguntas rutinarias** de validación y ejecuta hasta cumplir el objetivo, pero **no** el punto 1.
4. **Protocolos “No cómplice” y orden** — [`../../.cursor/rules/01-protocolos-dt.mdc`](../../.cursor/rules/01-protocolos-dt.mdc): cuestionar antes de ejecutar acciones con impacto (modo default, cuando no hay autonomía explícita).
5. **Multi-proyecto** — si hay ambigüedad de repo Git, **preguntar o inferir** según [multi-project.md](multi-project.md); no asumir en silencio.

## Autonomía total (loop de orden continuo)

El DT aplica el orden de forma **autónoma y siempre activa** (regla `07-orden-continuo`): tras cualquier cambio sustantivo corre `dt-doctor` y corrige hasta verde **sin preguntar**, incluso en cambios de impacto. La única barrera es el **gate duro** del punto 1. Condiciones de corte (tope de iteraciones, no-progreso, freno de emergencia `stop`/`pará`) viven en el cuerpo de la regla `07`.

## Fast lane

Invocación: comando `/fast-lane` (Cursor) o workflow equivalente (Antigravity). Efecto: ejecutar hasta completar el alcance acordado con plan inicial; **no** spamear preguntas de validación rutinarias. Los **gates** del punto 1 siguen activos.

## Resolución de dudas

Si persiste ambigüedad, priorizar seguridad → aclaración humana → default conservador (no ejecutar acción destructiva).
