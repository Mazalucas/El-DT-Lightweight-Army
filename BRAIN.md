# Lucas Prime — segundo cerebro

Portal de una pantalla: **qué existe**, **dónde está** y **cómo arrancar**.

## Ritual diario

```text
/actualizar  →  /yo  →  trabajar  →  /guardar
```

Sin sesión (`vitals/ops/session.yaml`), la IA pedirá **`/yo`** antes de escribir en el repo.

## Capas

| Capa | Qué es | Dónde |
|------|--------|-------|
| **Núcleo** | DT: reglas, pulse, Git, commands | `vitals/` · `.cursor/` · `AGENTS.md` |
| **Catálogo** | Registro de módulos y herramientas | [vitals/catalog/](vitals/catalog/) |
| **Conocimiento** | Notas, áreas, recursos duraderos | [knowledge/](knowledge/) |
| **Módulos** | Proyectos y herramientas plug-and-play | [modules/](modules/) |

## Módulos activos

| ID | Tipo | Descripción | Arrancar |
|----|------|-------------|----------|
| `lucas-prime` | hub | Este repo (cerebro + DT) | Estás aquí |
| [facturas-autonomo-es](apps/README.md) | tool (local) | Facturas de autónomo — app local gitignored | **`/nueva-factura`** |
| [recordatorios](modules/recordatorios/) | tool | Recordatorios con categorías, tags y captura chat | **`/recordatorios`** · captura **`/recordatorio`** |
| [tools-hub](modules/tools-hub/) | hub | Índice local legacy | **`/tools-hub`** (dev) |
| [cerebro-app](modules/cerebro-app/) | hub | **Webapp unificada (Firebase)** | **`/start`** |
| [meet-notes-sync](modules/meet-notes-sync/) | tool | Notas Gemini → Markdown local | **`/sincronizar-notas-meet`** |
| [cerebro-profesional](modules/cerebro-profesional/) | tool | Contactos, equipos, búsqueda y timelines | **`/cerebro-profesional`** |

Catálogo canónico (máquina): [vitals/catalog/modules.yaml](vitals/catalog/modules.yaml)

## Crear un módulo nuevo

1. Copiar [modules/_template/](modules/_template/) → `modules/{tu-id}/`
2. Editar `module.yaml` y `README.md`
3. Registrar en [vitals/catalog/modules.yaml](vitals/catalog/modules.yaml)
4. Si aplica Git multi-root: añadir entrada en `vitals/workspace.yaml` (local, desde [workspace.yaml.example](vitals/workspace.yaml.example))

## Documentación del framework

- Portal docs: [docs/README.md](docs/README.md)
- Cerebro colaborativo DT: [docs/00_overview/cerebro-equipo-mecanismos-dt.md](docs/00_overview/cerebro-equipo-mecanismos-dt.md)
- Vitals (pulse, memoria): [vitals/INDEX.md](vitals/INDEX.md)
