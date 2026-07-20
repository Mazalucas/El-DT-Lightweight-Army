# Documentación (DT)

Carga automática con glob `docs/**`. Si vas a crear docs **sin** archivos abiertos aún, el DT debe leer esta regla igual (mandato en `00-orquestador-core`).

**Canónico completo:** abrir **`docs/99_meta/protocolo-documentacion-ia.md`** (`DOC-META-001`) antes de crear o refactorizar bajo `docs/`.

## Capas bajo `docs/`

```text
00_overview/  01_concepts/  02_guides/  03_reference/
04_architecture/  05_decisions/  06_operations/  07_glossary/  99_meta/
```

Portal: `docs/README.md` (`DOC-OV-001`). Telemetría DT: `vitals/INDEX.md` (complemento, no reemplazo de docs).

## Qué cambió → dónde

| Cambio | Capa | ID |
|--------|------|-----|
| DT / reglas / pipeline | `00_overview/` o rule-bodies | `DOC-OV-*` |
| Concepto / por qué | `01_concepts/` | `DOC-CONCEPT-*` |
| How-to | `02_guides/` | `DOC-GUIDE-*` |
| Contrato estable | `03_reference/` + CHANGELOG | `DOC-REF-*` |
| Arquitectura | `04_architecture/` | `DOC-ARCH-*` |
| Decisión (ADR) | `05_decisions/` | `DOC-DEC-*` |
| Runbook / ops | `06_operations/` | `DOC-OPS-*` |
| Glosario | `07_glossary/` | `DOC-GLOSS-*` |
| Evento orquestación | `vitals/pulse/entries/` | `pulse_id` |

Si dudás: capa de **mayor autoridad** (decision > architecture > reference > guide) y enlazá desde la otra.

## Obligaciones mínimas

1. **Fuente única** — un concepto, un doc canónico (`source_of_truth: true` donde aplique).
2. **Frontmatter YAML** en todo `.md` nuevo bajo `docs/`: `id`, `title`, `type`, `status`, `owner`, `updated`, `tags`, `summary`, `related`, `priority`, `source_of_truth`.
3. **IDs** `DOC-<DOMINIO>-<NNN>` — registrar dominios nuevos en `docs/99_meta/id-registry.md`. Próximo libre: `ruby scripts/sync-catalog.rb --next <DOMINIO>`.
4. **Plantillas** en `docs/99_meta/templates/` según `type`.
5. **Catálogo** — `ruby scripts/sync-catalog.rb` tras agregar/mover docs (no editar `catalog.yaml` a mano).
6. **Nombres** semánticos estables; evitar `final-v2`, `misc`.

## ADR (mínimo)

Contexto · Decisión · Consecuencias. Tipos: `overview`, `concept`, `guide`, `reference`, `architecture`, `decision`, `runbook`, `glossary`, `policy`, `faq`.

## Checklist antes de cerrar doc nuevo

- [ ] Capa correcta y ID registrado
- [ ] Frontmatter completo
- [ ] `sync-catalog.rb` ejecutado si aplica
- [ ] Enlaces internos válidos
- [ ] Detalle profundo en DOC-META-001 consultado si el doc es no trivial
