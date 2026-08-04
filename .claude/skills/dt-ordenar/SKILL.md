---
name: dt-ordenar
description: >-
  Captura y ordenación de conocimiento — archivos, carpetas y dumps del chat
  documentados en la capa correcta para retrieval. Use when /ordenar, ordenar,
  documentar dump, capturar conocimiento, volcar archivos, organizar docs,
  knowledge capture, inbox, clasificar información.
---

# dt-ordenar — captura y ordenación de conocimiento

Orquestador de **ingesta → clasificación → documentación → indexación**. Objetivo: maximizar **relevancia por token** (DOC-META-001) — cada pieza en la capa correcta, enlazada y recuperable.

**Guía operativa:** `docs/02_guides/ordenar-captura-conocimiento.md` (`DOC-GUIDE-016`).

## Protocolos DT (heredar)

Ordenar, cuestionar (1 pregunta si el volumen es enorme y el objetivo es ambiguo), alternativas, **Contexto consultado**, **Puntos ciegos / Mejoras detectadas**, post-delegación. Multi-agente: `DEFER: doc` para bloques puramente editoriales tras el plan de archivo.

## Activación

| Invocación | Alcance |
|------------|---------|
| `/ordenar` | Pipeline completo (default **deep**) |
| `/ordenar quick` | Plan + máx. 3 docs canónicos; resto en `sources/` |
| `/ordenar inbox` | Solo cuaderno personal (`vitals/work/inbox/{id}/`) |
| `/ordenar docs` | Forzar promoción a `docs/` (con frontmatter) |
| Texto libre + archivos/carpetas | Parsear tema y modo del mensaje |

## Prerequisitos (gate)

1. **`vitals/ops/session.yaml`** con `operator.id` — si falta → **`/yo`** y **no** escribir hasta tener sesión.
2. Leer **`docs/99_meta/protocolo-documentacion-ia.md`** (`DOC-META-001`) — capas, chunking, frontmatter.
3. **Secretos:** nunca volcar credenciales al repo. Si aparecen en inputs → `***REDACTED***`, marcar en manifest, sugerir vault/env.

## Pipeline (6 fases)

### Fase 1 — Inventario

Recopilar **todo** lo entregado:

- Texto pegado en el chat
- Paths de archivos/carpetas del repo (`@`, rutas explícitas)
- Adjuntos del IDE

Por cada ítem registrar en notas internas:

| Campo | Uso |
|-------|-----|
| `source` | path o `chat-paste` |
| `kind` | md, csv, code, pdf-ref, mixed |
| `topic` | 1 línea |
| `sensitivity` | ok \| secret \| pii |
| `size` | small \| medium \| large |

**Buscar duplicados:** `docs/99_meta/catalog.yaml`, grep por keywords del tema, `related` existentes. Si ya hay canónico → **merge/enlazar**, no duplicar.

### Fase 2 — Plan de archivo (antes de escribir)

Presentar tabla de triage (chat o canvas si hay muchas filas). Matriz detallada: **`references/classification-matrix.md`**.

Columnas mínimas: **Fuente** · **Destino** · **Acción** (`create` \| `merge` \| `archive` \| `defer`) · **ID/tipo** · **Por qué esta capa**.

**Destinos habituales:**

| Destino | Cuándo |
|---------|--------|
| `docs/00_overview/` … `07_glossary/` | Conocimiento de producto/proyecto reutilizable |
| `docs/05_decisions/` | Decisiones con contexto y consecuencias (ADR) |
| `vitals/work/knowledge/YYYY-MM-DD-{slug}/` | Paquete de sesión + manifest |
| `vitals/work/knowledge/.../sources/` | Raw voluminoso o no destilado aún |
| `vitals/work/inbox/{operator_id}/` | Notas personales, borradores de trabajo |
| `vitals/memory/inbox/` | Solo **propuestas** de patrón DT (con `evidence[]`) — **nunca** auto-promover |
| `vitals/work/inbox/**/draft-*` | Solo si el operador pide **no versionar** aún |

En modo **deep**, confirmar el plan en 1–2 líneas si hay >5 destinos o decisiones conflictivas; en **`/fast-lane`** o alcance explícito, ejecutar el plan.

### Fase 3 — Documentar

Para cada fila `create` o `merge`:

1. Capa + plantilla en `docs/99_meta/templates/`.
2. Frontmatter completo (`id`, `type`, `summary`, `related`, `keywords`, `source_of_truth` donde aplique).
3. Chunking: secciones con una intención; summary aislable.
4. IDs nuevos → `docs/99_meta/id-registry.md` + `ruby scripts/sync-catalog.rb`.

**Volumen grande:**

- Extraer **resumen recuperable** al doc canónico en `docs/`.
- Copia o extracto en `sources/` con índice `sources/README.md` (qué hay, keywords, enlace al doc destilado).
- No pegar tablas gigantes en overview ni en un solo chunk.

**Delegación:** si >3 documentos nuevos o >15k tokens de redacción → Task `subagent_type: doc` con el plan de archivo y paths; el orquestador integra manifests y enlaces.

### Fase 4 — Indexar y enlazar

1. `ruby scripts/sync-catalog.rb`
2. Actualizar `related` cruzados entre docs nuevos y existentes.
3. Si el tema abre una nueva área → una línea en índice de capa (`docs/README.md` o índice de `02_guides/` según convención local).
4. Pulse opcional si el evento es relevante para el equipo (`vitals/pulse/entries/`).

### Fase 5 — Orden DT

Una pasada **`./scripts/dt-doctor.sh`** (regla `07-orden-continuo`). Corregir lo corregible; listar gate duro en puntos ciegos.

### Fase 6 — Manifest y cierre

Escribir **`vitals/work/knowledge/YYYY-MM-DD-{slug}/manifest.md`** usando **`references/manifest-template.md`**.

**Chat (veredicto):**

1. Qué se capturó (1 línea)
2. Tabla corta: **path** → **ID** → **cómo encontrarlo** (keywords)
3. Pendientes / `defer`
4. Recordar **`/guardar`** si hay cambios versionables

## Cierre obligatorio

- **Contexto consultado** (paths, catalog, inputs)
- **Puntos ciegos / Mejoras detectadas**
- Post-delegación: `HANDOFF_TO` si queda trabajo (`doc`, `dt`, `researcher`)

## Cuándo NO sos vos

| Pedido | Rol |
|--------|-----|
| Solo mapa del repo | `/contexto` |
| Solo números/planillas | `/verificar` + `data-auditor` |
| Seguridad / vulns | `/hack` + `hack-audit` |
| Promover regla sin aprobación | `vitals/memory/` — requiere humano |
