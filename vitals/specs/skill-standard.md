# Estándar de skills del DT

Una skill se escribe **una vez** y queda disponible en todos los IDE habilitados. No se mantiene una copia por IDE.

## Canon y espejos

| Rol | Dónde |
|-----|--------|
| Canon | `.cursor/skills/<nombre>/SKILL.md` |
| Registro de IDE | `vitals/config/ide-targets.yaml` |
| Espejos | Cada target con `enabled: true` y `receives_skills: true` |

Hoy eso copia a Antigravity y Codex (`.agents/skills/`) y a Claude Code (`.claude/skills/`). Copilot no recibe el árbol: lee `AGENTS.md`. Gemini y Windsurf están en el registro con `enabled: false` hasta que alguien los prenda.

El emisor es `./scripts/sync-ide.sh`. No editar los espejos a mano. `./scripts/sync-skills-parity.sh` solo llena `.agents/skills/`; `/skills` usa `sync-ide`, que cubre todos los destinos.

## Contrato de cada `SKILL.md`

1. Frontmatter con `name` y `description`.
2. `name` igual al nombre de la carpeta.
3. `description` incluye `Use when` (cuándo debe cargarse).
4. El cuerpo no asume un solo IDE. Si un paso cambia, una tabla o un spec compartido (`vitals/specs/…`).
5. Si la persona la invoca con `/algo`, hay una entrada en `vitals/config/commands-meta.yaml` cuyo `skill:` es esa carpeta.

## Google (`/drive`, `/gmail`, `/calendar`)

Las tres skills delegan la instalación en `vitals/specs/google-apps-mcp.md` § Instalar. Deben incluir la frase exacta: `No recorras Google Cloud Console.`

Marketplace / Store / Connectors primero. No citan el runbook de IT. El runbook de IT no se abre ni se ejecuta en el chat de un usuario final. La spec de install no incluye recetas de Cloud (redirect URIs, APIs a habilitar, JSON `oauth`).

## Cómo dejarlas iguales en todos los IDE

Invocar **`/skills`** (skill `dt-skills`). Corre `scripts/audit-skills.rb` y después `./scripts/sync-ide.sh`.

`./scripts/dt-doctor.sh` llama al mismo audit. Un error ahí es una skill que no cumple el contrato o un command que apunta a una carpeta que no existe.
