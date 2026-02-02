# El DT — Director Técnico para Cursor

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
**v1.0.0**

> El orquestador que convierte al asistente de IA en un **Director Técnico**: un socio que ordena, cuestiona y propone, en lugar de ejecutar sin criterio.

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

## Instalación (2 pasos)

1. **Cloná o descargá** este repositorio
2. **Copiá la carpeta `.cursor/`** a tu proyecto

No requiere scripts, dependencias ni configuración adicional. Cursor detecta automáticamente las rules y commands.

### Opción: usar como template

En GitHub: **Use this template** → crear repo nuevo → el orquestador ya viene incluido.

---

## Cómo usarlo

### Comandos disponibles

| Comando | Cuándo usarlo |
|---------|---------------|
| `/orquestar` | Tarea completa: clarificar → cuestionar → mapear → delegar → planificar → ejecutar → entregar |
| `/cuestionar` | Solo analizar: preguntar, proponer alternativas — **sin ejecutar** |
| `/contexto` | Mapear el repo y obtener una visión del sistema |
| `/prepr` | Preparar cambios como PR (checklist, tests, descripción) |

### Pipeline del DT (7 pasos)

1. **Clarificar** — Objetivo, restricciones, alcance
2. **Cuestionar** — Validar antes de aprobar
3. **Mapear** — Archivos y dependencias relevantes
4. **Delegar** — Subagentes especializados si aplica
5. **Planificar** — Checkpoints y orden de ejecución
6. **Ejecutar** — Implementar con validación (lint, tests, build)
7. **Entregar** — Resumen + cambios + puntos ciegos detectados

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
.cursor/
├── rules/           # Core, protocolos, catálogo, reglas de dominio
├── commands/        # orquestar, cuestionar, contexto, prepr
└── agents/          # 20 subagentes especializados
```

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

**El DT** — Orquestador para Cursor  
Creado por [Lucas](https://github.com/Mazalucas)  
Inspirado en [Agents examples](https://github.com/agents/examples)
