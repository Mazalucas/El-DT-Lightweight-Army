---
dt_command: verificar
group: work
group_title: "Trabajo con el framework"
tagline: "Verificar números de planillas y reportes con script, sin cálculo mental de la IA."
skill: data-auditor
---

# /verificar

**Grupo:** Trabajo con el framework
**En una frase:** Verificar números de planillas y reportes con script, sin cálculo mental de la IA.
**Cuándo:** Compartís una planilla/reporte o pedís totales, sumas o reconciliación de cifras.
**Quién:** Cualquier operador del repo.

Ejecutá el skill **`data-auditor`** — `.cursor/skills/data-auditor/` y `.agents/skills/data-auditor/`.

Delegá en el subagente **`data-auditor`** (`.cursor/agents/data-auditor.md`) vía Task (`subagent_type: data-auditor`) con el alcance del usuario. Si el IDE no expone subagentes (Antigravity, Codex), ejecutá el pipeline de la skill en esta conversación.

_Generado desde `vitals/config/commands-meta.yaml` — corré `scripts/sync-commands-from-meta.sh`._
