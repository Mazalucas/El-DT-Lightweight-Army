# First-run checklist — dt-setup

Usar en **modo first-run** (`/bienvenida` o primera vez). Solo lectura de archivos y comandos de diagnóstico; **no** correr sync ni `dt-doctor` salvo drift evidente y petición explícita de repair.

## 1. Git root

- Si existe `vitals/workspace.yaml` → respetar multi-proyecto (regla `05-multi-project-git`).
- Si no → raíz del repo clonado.

## 2. Archivos obligatorios (leer paths)

| Path | Propósito |
|------|-----------|
| `AGENTS.md` | Puerta de entrada IA |
| `VERSION` | Versión del template DT |
| `.cursor/rules/00-orquestador-core.mdc` | Orquestador Cursor |
| `.cursor/skills/dt-session/SKILL.md` | `/yo` |
| `.cursor/skills/git-actualizar/SKILL.md` | `/actualizar` |
| `.cursor/skills/git-guardar/SKILL.md` | `/guardar` |
| `.cursor/skills/dt-setup/SKILL.md` | Este skill |

## 3. Targets enabled (`vitals/config/ide-targets.yaml`)

Verificar presencia según cada target con `enabled: true`:

| Target | Paths mínimos |
|--------|----------------|
| cursor | `.cursor/rules/`, `.cursor/commands/`, `.cursor/skills/` |
| antigravity | `.antigravity/rules.md`, `.agents/rules/`, `.agents/workflows/`, `.agents/skills/` |
| claude | `CLAUDE.md`, `.claude/rules/`, `.claude/skills/` |
| codex | `AGENTS.md`, `.agents/skills/` |
| copilot | `.github/copilot-instructions.md` |

## 4. Git (diagnóstico)

```bash
git --version
git remote -v
```

- Si `git` no está instalado → instrucciones plain por OS; **no** instalar sin confirmación explícita.
- Si no hay `origin` → puede ser repo post-`/bootstrap`; explicar que Fase A de `/actualizar` sincroniza el producto.
- **dt-upstream:** si hay `origin`, no hay remote `dt-upstream`, y el repo es El DT → registrar según skill `dt-setup` (consumidor vs canónico). Copiar `vitals/config/dt-upstream.example.md` si falta config.
- Estado local opcional: `vitals/ops/dt-upstream-state.md` (desde `.example.md`, gitignored).

## 5. Drift evidente (opcional → sugerir modo repair)

Señales de que hace falta `/setup` repair:

- Faltan paths de la tabla §2 o §3.
- Usuario reporta que rules/commands no cargan tras pull grande.

## 6. Cierre obligatorio

- Entregar el mensaje completo según [`welcome-message.md`](welcome-message.md) (§ plantilla).
- Recordar: **`/yo`** con nombre y rol.

## 7. Entrega non-dev (deprecado — usar welcome-message.md)

Usar solo [`welcome-message.md`](welcome-message.md) como formato único de bienvenida.

## Troubleshooting plain

| Problema | Qué decir |
|----------|-----------|
| Falta un archivo del checklist | "El clone parece incompleto. Volvé a clonar o pedí ayuda al equipo." |
| Git no instalado | "Necesitás Git para `/guardar` y `/actualizar`. Instalalo desde …" |
| Quieren editar rules | "Editá fuentes en `vitals/specs/rule-bodies/` o `.cursor/skills/` — no espejos generados a mano." |
