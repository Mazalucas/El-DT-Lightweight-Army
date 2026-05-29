# Scripts — El DT

| Script | Uso |
|--------|-----|
| [sync-commands-from-meta.sh](sync-commands-from-meta.sh) | YAML → `.cursor/commands/` + `.agent/workflows/` (misma lista, sin duplicar lógica manual) |
| [sync-skills-parity.sh](sync-skills-parity.sh) | `.cursor/skills/` → `.agent/skills/` (raíz: solo `SKILL.md`; `marketing/*`: árbol completo) |
| [sync-dt-from-vitals.sh](sync-dt-from-vitals.sh) | Rules `04`–`05` desde `vitals/specs/rule-bodies/` |

## Flujo al agregar un command

1. Entrada en **`vitals/config/commands-meta.yaml`**.
2. Si lleva lógica larga: un solo archivo canónico (`command_path` o `workflow_path`); el sync replica al otro IDE.
3. Si lleva skill: carpeta en **`.cursor/skills/<nombre>/`** y corré `./scripts/sync-skills-parity.sh`.
4. `./scripts/sync-commands-from-meta.sh`

## Verificación

```bash
./scripts/sync-commands-from-meta.sh --check
```
