# tools/ — arsenal reutilizable para agentes

Capa canónica de **herramientas** que los subagentes del DT descubren y reutilizan. No confundir con:

| Capa | Rol |
|------|-----|
| [`scripts/`](../scripts/) | Mantenimiento del framework DT (sync-ide, dt-doctor, catálogo) |
| **`tools/`** | Plantillas, primitivas y scripts que los agentes copian o invocan en proyectos |
| [`.cursor/skills/`](../.cursor/skills/) | Comportamiento y protocolos del agente |

## Catálogo

Ver [`REGISTRY.md`](REGISTRY.md) — tabla maestra de tools, paths, agentes y commands.

Referencia estable en docs: [`docs/03_reference/tools-registry.md`](../docs/03_reference/tools-registry.md) (`DOC-REF-007`).

## Convenciones

- **Instalar y correr** desde cada tool (ej. `cd tools/remotion && npm install && npm run dev`).
- **No commitear** `node_modules/` ni renders (`out/`, `output/`) bajo `tools/`.
- Los **outputs de render** van en `output/remotion/` (gitignored) o carpeta equivalente del proyecto consumidor.
- Las composiciones concretas del producto viven en el repo del consumidor, no en esta plantilla.

## Tools disponibles

| Tool | Path | Agente |
|------|------|--------|
| Remotion | [`remotion/`](remotion/) | `remotion-producer` · command `/remotion` |
