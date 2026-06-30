# Manifiesto — paths sync `/actualizar-dt`

La IA usa esta lista al hacer dry-run y apply. Respetar **`preserve_paths`** del frontmatter de `vitals/config/dt-upstream.md`.

## Incluir (checkout desde tag upstream)

- `.cursor/`
- `.agent/`
- `.antigravity/`
- `.claude/`
- `.agents/`
- `vitals/config/` (excepto exclusiones abajo)
- `vitals/specs/`
- `vitals/data/`
- `scripts/`
- `tools/`
- `docs/` (completo)
- `AGENTS.md`
- `CLAUDE.md`
- `VERSION`

## Excluir siempre

- `vitals/ops/session.yaml`
- `vitals/ops/dt-upstream-state.md`
- `vitals/workspace.yaml`
- `vitals/work/inbox/`
- `.env`, `.env.local`, `.env.*.local`
- `*.credentials`

## Excluir por defecto (estado del equipo)

- `vitals/config/roster.yaml`
- `vitals/config/roles.yaml`
- `vitals/pulse/entries/`
- `vitals/pulse/current.md`

## preserve_paths

Cualquier path listado en el frontmatter del consumidor se trata como **excluido**.
