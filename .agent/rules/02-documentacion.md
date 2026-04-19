---
description: Protocolo de documentación orientada a IA — capas docs/, metadata, IDs DOC-<DOMINIO>, lectura obligatoria del canónico en 99_meta
---

# Documentación (DT)

**Aplica siempre** al operar como Director Técnico en este repositorio. El texto completo del protocolo (todas las secciones, ecuaciones, reglas) está en **`docs/99_meta/protocolo-documentacion-ia.md`** (`DOC-META-001`). Abrilo antes de crear o refactorizar documentación bajo `docs/`.

**Mejora continua:** Los equipos pueden adaptar el protocolo. Editar `docs/` y el propio protocolo en `99_meta` es **válido y deseable** cuando se actualizan `updated`, `owner`, `status` y vínculos; no trates el canónico como inmutable salvo política explícita del proyecto.

## Jerarquía de niveles (memoria del proyecto)

| Nivel | Ubicación | Uso |
|-------|-----------|-----|
| **1 - Acceso rápido** | README, CHANGELOG, índices | Visión general, quick start |
| **2 - Contexto de decisión** | `docs/` por capas, ADRs | Decisiones, patrones, contexto |
| **3 - Memoria de implementación** | Comentarios, JSDoc, docstrings | Detalles de código |
| **4 - Trazabilidad** | Commits, PR descriptions | Historial, cambios |

## Capas obligatorias bajo `docs/`

```text
docs/
  00_overview/   → mapa, quickstart, índices
  01_concepts/   → qué es / por qué
  02_guides/     → cómo hacer X
  03_reference/  → lookup técnico estable
  04_architecture/
  05_decisions/  → ADRs
  06_operations/ → runbooks, deploy
  07_glossary/
  99_meta/       → protocolo, plantillas, id-registry, catalog
```

**Portal:** `docs/README.md` (`DOC-OV-001`).

**Vitals (telemetría y normativa del DT):** `vitals/INDEX.md` — pulse, memoria sugerida y specs canónicas; no sustituye `docs/`, es complementario para orquestación.

## Obligaciones operativas

1. **Fuente única:** un concepto → un documento canónico (`source_of_truth` y enlaces; no duplicar semántica).
2. **Frontmatter YAML** en todo Markdown nuevo bajo `docs/` con campos mínimos: `id`, `title`, `type`, `status`, `owner`, `updated`, `tags`, `summary`, `related`, `priority`, `source_of_truth` (más los que aplique el protocolo).
3. **IDs:** forma `DOC-<DOMINIO>-<NNN>` (ej. `DOC-AUTH-001`). Registrar prefijos nuevos en `docs/99_meta/id-registry.md` antes de acuñar un dominio nuevo.
4. **Plantillas:** `docs/99_meta/templates/` según `type` (concept, guide, reference, decision, runbook, etc.).
5. **Catálogo:** mantener coherentes rutas relevantes con `docs/99_meta/catalog.yaml` cuando agregues docs indexados.
6. **Naming de archivos:** semántico y estable (`jwt-refresh-flow.md`); evitar `final-v2`, `misc`.

## Tipos documentales

Usar un `type` explícito por archivo: `overview`, `concept`, `guide`, `reference`, `architecture`, `decision`, `runbook`, `glossary`, `policy`, `faq`.

## Cuándo documentar qué (resumen)

- **Decisiones arquitectónicas:** `docs/05_decisions/` (ADRs) o `04_architecture/` según alcance.
- **Cambios de API:** CHANGELOG + `03_reference/` si hay contrato estable.
- **Setup / how-to:** `02_guides/`.
- **Contexto en código:** comentarios, JSDoc.

## Formato ADR (mínimo)

```markdown
# ADR-001: [Título]

## Contexto
[Qué problema se resuelve]

## Decisión
[Qué se decidió]

## Consecuencias
[Pros y contras]
```

## Lectura obligatoria para tareas de documentación

1. `docs/99_meta/protocolo-documentacion-ia.md`
2. `docs/99_meta/id-registry.md` si asignás IDs nuevos
3. Plantilla correspondiente en `docs/99_meta/templates/`
