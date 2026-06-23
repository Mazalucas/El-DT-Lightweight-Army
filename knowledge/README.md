# Conocimiento durable

Notas y referencias que **no son código** ni un módulo ejecutable. Versionado en Git salvo que indiques lo contrario.

## Estructura (PARA simplificado)

| Carpeta | Uso |
|---------|-----|
| [areas/](areas/) | Temas ongoing sin fecha de cierre (finanzas personales, salud, aprendizaje…) |
| [resources/](resources/) | Material de referencia, investigación, enlaces curados |
| [archive/](archive/) | Inactivo pero consultable |

## Relación con módulos

- Un **módulo** (`modules/`) es una herramienta o proyecto con manifest y entrypoints.
- **Knowledge** es contexto transversal; puede alimentar varios módulos.
- Si un pack de conocimiento crece y tiene ciclo propio, promocionalo a módulo `kind: knowledge-pack`.
