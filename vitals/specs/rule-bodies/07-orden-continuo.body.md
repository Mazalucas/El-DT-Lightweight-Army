# Orden continuo

Tras cambios que toquen `docs/`, reglas, commands, skills, `vitals/specs/`, `vitals/config/` o estructura del repo:

1. Ejecutar el cambio pedido.
2. **Una pasada** de `./scripts/dt-doctor.sh`.
3. Corregir hallazgos que no sean gate duro; si quedan pendientes, listarlos en **Puntos ciegos**.
4. Loop completo (repetir hasta verde) solo si el usuario lo pide o el cambio es normativa DT mayor.

## Orden en verde (DoD)

Frontmatter en docs · capa correcta · `sync-catalog.rb` · IDs en id-registry · enlaces válidos · paridad multi-IDE (`sync-ide.sh --check`) · pulse fresco si cambió `VERSION`.

## Gate duro

Secretos nunca al repo · irreversibles FS/Git (force push, bootstrap) → confirmación humana. `vitals/specs/precedence.md`.

## Herramientas

`dt-doctor.sh` · `sync-catalog.rb` · `sync-ide.sh` · `sync-commands-from-meta.sh`
