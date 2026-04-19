# El DT — Director Técnico

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
**v1.2.0**

> El orquestador que convierte al asistente de IA en un **Director Técnico**: un socio que ordena, cuestiona y propone, en lugar de ejecutar sin criterio.

## Soporte multi-IDE

El DT funciona en **Cursor** y **Antigravity**. Al clonar o cambiar de IDE, ejecutá el comando de setup correspondiente para evitar conflictos. Ver [docs/IDE-SETUP.md](docs/IDE-SETUP.md).

---

## ¿Por qué El DT?

Los asistentes de IA suelen decir que sí a todo. Ejecutan sin validar, no anticipan riesgos y no proponen alternativas. El resultado: código que funciona hoy pero genera deuda mañana.

**El DT** cambia eso. No es un ejecutor pasivo — es un **socio estratégico** que piensa antes de actuar.

---

## Qué aporta

| Beneficio | Descripción |
|-----------|-------------|
| **Orden** | Estructura, jerarquía y criterio antes de cada acción |
| **Cuestionamiento** | Preguntas de validación en lugar de aprobaciones automáticas |
| **Alternativas** | Propone caminos con pros y contras, no una sola solución |
| **Puntos ciegos** | Detecta riesgos, dependencias y mejoras que podrías pasar por alto |
| **Delegación inteligente** | 20 subagentes especializados para tareas específicas |
| **Documentación** | Memoria en README, docs, comentarios y commits |

---

## Instalación

1. **Cloná o descargá** este repositorio
2. **Si usás Cursor**: Copiá la carpeta `.cursor/` a tu proyecto, o ejecutá `/setup-cursor` para dejar solo la config de Cursor
3. **Si usás Antigravity**: Ejecutá `/setup-antigravity` para dejar solo la config de Antigravity

No requiere dependencias de runtime. Opcional: [scripts/sync-dt-from-vitals.sh](scripts/sync-dt-from-vitals.sh) regenera reglas `04`–`05` desde `vitals/specs/rule-bodies/`. Ver [docs/IDE-SETUP.md](docs/IDE-SETUP.md) para detalles.

### Opción: usar como template

En GitHub: **Use this template** → crear repo nuevo → el orquestador ya viene incluido.

---

## Cómo usarlo

### Comandos disponibles

| Comando | Cuándo usarlo |
|---------|---------------|
| `/orquestar` | Tarea completa (**8 pasos** anidados en **4 fases** macro del core): clarificar → cuestionar → mapear → delegar → planificar → ejecutar → entregar → cierre documental |
| `/fast-lane` | Alcance cerrado: plan breve y ejecución hasta terminar (sin preguntas rutinarias; seguridad y multi-repo sin relajar) |
| `/cuestionar` | Solo analizar: preguntar, proponer alternativas — **sin ejecutar** |
| `/contexto` | Mapear el repo y obtener una visión del sistema |
| `/prepr` | Preparar cambios como PR (checklist, tests, descripción) |
| `/setup-cursor` | (Cursor) Eliminar config de Antigravity, dejar solo Cursor |
| `/setup-antigravity` | (Antigravity) Eliminar config de Cursor, dejar solo Antigravity |

### Pipeline del DT — macro (4 fases) y micro (8 pasos)

**Macro** (modelo mental del core): **Clarificar → Planificar y validar → Ejecutar → Entregar** (incluye cierre documental y puntos ciegos cuando aplica). La validación incluye **cuestionar** antes de acciones con impacto, salvo **`/fast-lane`** explícito — ver `vitals/specs/precedence.md`.

**Micro** (comando `/orquestar`, 8 pasos — desglose operativo del macro):

1. **Clarificar** — Objetivo, restricciones, alcance
2. **Cuestionar** — Validar antes de aprobar
3. **Mapear** — Archivos y dependencias relevantes
4. **Delegar** — Subagentes especializados si aplica
5. **Planificar** — Checkpoints y orden de ejecución
6. **Ejecutar** — Implementar con validación (lint, tests, build) o N/A
7. **Entregar** — Resumen + cambios + puntos ciegos detectados
8. **Cierre documental** — `docs/` y catálogo si aplica, o línea **N/A**

---

## Subagentes (20 especialidades)

El DT delega según la tarea. Todos mantienen los mismos protocolos: ordenar, cuestionar, proponer.

| Departamento | Subagentes |
|--------------|------------|
| **Engineering** | arquitecto, frontend, devops, ui-designer |
| **Planning** | prd-creator, srd-creator, development-planner |
| **Testing** | qa |
| **Design** | ux-researcher |
| **Product** | product-strategist, feedback-synthesizer |
| **Research** | researcher |
| **Documentation** | doc |
| **Marketing** | content-creator, marketing-strategist, brand-guardian, growth-hacker, pitch-specialist, storytelling-specialist |
| **Operations** | operations-maintainer |

---

## Estructura del proyecto

```
vitals/                     # Pulse, memoria sugerida, specs canónicas DT (ver vitals/INDEX.md)
scripts/
└── sync-dt-from-vitals.sh  # Regenera rules 04–05 desde vitals/specs/rule-bodies/

.cursor/                    # Cursor
├── rules/                  # Core, protocolos, catálogo, recomendación tooling, multi-repo, dominio
├── commands/               # orquestar, fast-lane, cuestionar, contexto, prepr, setup-cursor
└── agents/                 # 20 subagentes especializados

.agent/                     # Antigravity
├── rules/                  # Reglas equivalentes
├── skills/                 # 20 skills (subagentes)
└── workflows/              # orquestar, fast-lane, cuestionar, contexto, prepr, setup-antigravity

.antigravity/               # Antigravity
└── rules.md               # Reglas principales
```

Adopción en repos existentes: [docs/02_guides/adopt-dt-in-existing-repo.md](docs/02_guides/adopt-dt-in-existing-repo.md) (`DOC-GUIDE-003`). Concepto Vitals: [docs/01_concepts/dt-vitals.md](docs/01_concepts/dt-vitals.md).

---

## Personalizar

- **Rules**: Añadí rules en `.cursor/rules/` para tu stack
- **Commands**: Creá `.md` en `.cursor/commands/` para workflows propios
- **Subagentes**: Usá la plantilla `_plantilla-subagente.md` y registralos en el catálogo

---

## Licencia

MIT License — libre para usar, modificar y distribuir. Solo se requiere **atribución** (incluir copyright y licencia). Ver [LICENSE](LICENSE).

---

## Créditos

**El DT** — Orquestador para Cursor y Antigravity  
Creado por [Lucas](https://github.com/Mazalucas)  
