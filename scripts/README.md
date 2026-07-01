# Scripts — El DT

| Script | Uso |
|--------|-----|
| [dt-doctor.sh](dt-doctor.sh) | **Verificador read-only del orden** (frontmatter, enlaces, catálogo, paridad multi-IDE, pulse). Motor del loop de orden continuo. Exit 0 = verde |
| [sync-ide.sh](sync-ide.sh) | **Emisor único multi-IDE**: recorre `vitals/config/ide-targets.yaml` y emite reglas, skills, commands (Claude) y punteros (CLAUDE.md, Copilot, …) desde fuentes canónicas |
| [sync-catalog.rb](sync-catalog.rb) | Deriva `docs/99_meta/catalog.yaml` del frontmatter; `--next <DOMINIO>` da el próximo ID libre |
| [sync-commands-from-meta.sh](sync-commands-from-meta.sh) | YAML → `.cursor/commands/` + `.agent/workflows/` |
| [sync-skills-parity.sh](sync-skills-parity.sh) | `.cursor/skills/` → `.agent/skills/` (raíz: solo `SKILL.md`; `marketing/*`: árbol completo) |
| [atelier-detect.sh](atelier-detect.sh) | Anti-slop determinístico (Impeccable CLI, 44+ reglas) sobre archivos o URLs |
| [dt-design-select.rb](dt-design-select.rb) | Selección de estilo/sistema Atelier según brief (motor de `/atelier select`) |

Upstream DT (`/actualizar` Fase B, `/actualizar-dt`): instrucciones en **Markdown** — skills `git-actualizar` y `dt-actualizar` + `vitals/specs/dt-upstream-config.md`. **Sin scripts Ruby de sync.**

## Flujo al agregar un command

1. Entrada en **`vitals/config/commands-meta.yaml`**.
2. Si lleva lógica larga: un solo archivo canónico (`command_path` o `workflow_path`); el sync replica al otro IDE.
3. Si lleva skill: carpeta en **`.cursor/skills/<nombre>/`** y corré `./scripts/sync-skills-parity.sh`.
4. `./scripts/sync-commands-from-meta.sh`

## Flujo al editar una regla

1. Editá el cuerpo en **`vitals/specs/rule-bodies/<stem>.body.md`** (fuente única).
2. Metadata (description, globs, alwaysApply) en **`vitals/config/rules-manifest.yaml`**.
3. `./scripts/sync-ide.sh` → emite a Cursor, Antigravity, Claude (y punteros Codex/Copilot).

## Flujo al agregar un IDE

1. Entrada en **`vitals/config/ide-targets.yaml`** (`enabled: true`).
2. `./scripts/sync-ide.sh`.

## Verificación (orden)

```bash
./scripts/dt-doctor.sh           # todo el orden
./scripts/sync-ide.sh --check    # solo paridad multi-IDE
./scripts/sync-commands-from-meta.sh --check
ruby scripts/sync-catalog.rb --check
```
