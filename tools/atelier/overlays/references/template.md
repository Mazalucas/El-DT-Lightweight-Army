# DT-only: template scaffold

Copy starter scaffold to active project.

## Usage

`/atelier template <landing|dashboard|auth> --scaffold [dest]`

## Steps

1. Confirm design-context exists (`/atelier init` if not).
2. Run `/atelier select` with surface brief.
3. Copy from `tools/atelier/starters/<name>/` to `dest` (default: project root or user path).
4. Apply tokens from selected design system `.md` in `.cursor/skills/design/templates/`.
5. Replace placeholders per `templates/shared/placeholders.md`.
6. `./scripts/atelier-detect.sh` on output.

## Without --scaffold

Use skill **`ui-templates`** — Markdown wireframes only, no file copy.
