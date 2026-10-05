---
name: dt-skills
description: "[Framework] Estandariza las skills del DT y las copia a todos los IDE habilitados. Use when the user invokes /skills, asks to standardize skills across IDEs, or after creating or editing a skill."
---

# dt-skills

Una skill, todos los IDE. El canon es `.cursor/skills/`. Los espejos salen de `vitals/config/ide-targets.yaml`.

**Spec:** `vitals/specs/skill-standard.md`.

## Flujo `/skills`

1. Si el cambio está en `.agents/skills/` o `.claude/skills/`, traerlo primero al canon. Esos directorios no se editan.
2. Correr `ruby scripts/audit-skills.rb`. Corregir cada error antes de seguir.
3. Correr `./scripts/sync-ide.sh` para copiar el canon a cada IDE con `receives_skills: true`.
4. Si hace falta un command nuevo: entrada en `vitals/config/commands-meta.yaml` y `./scripts/sync-commands-from-meta.sh`.
5. Volver a correr `ruby scripts/audit-skills.rb` y `ruby scripts/sync-ide.rb --check`.
6. Decir cuántas skills quedaron y en qué IDE (Antigravity, Codex, Claude). Avisar los WARN de `Use when` sin reescribir skills ajenas al pedido.

## Contrato (resumen)

- `name` = carpeta. `description` con `Use when`.
- Paso que cambia por IDE → tabla o spec, no un párrafo solo para Cursor.
- `/drive` `/gmail` `/calendar` incluyen `No recorras Google Cloud Console.` Marketplace / Store primero. No citan el runbook de IT. No dictan el alta en Cloud.

## No hacer

- No duplicar `SKILL.md` a mano en cada IDE.
- No crear la skill solo en `.claude/` o `.agents/`.
- No prender Gemini o Windsurf sin `enabled: true` en `ide-targets.yaml`.
- No commitear `session.yaml`.
