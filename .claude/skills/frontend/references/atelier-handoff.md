# Atelier handoff → frontend

Cuando **ui-designer** o **`/atelier craft`** entrega UI:

## Craft ya implementó código

Si `/atelier craft` completó la UI:

- [ ] Revisar integración con routing, auth, API del proyecto
- [ ] Añadir tests E2E/unit si aplica
- [ ] Verificar `./scripts/atelier-detect.sh` en paths tocados
- [ ] No reescribir visual salvo bugs — respetar design-context

`HANDOFF_TO: frontend` solo para capas no-UI (data, auth backend, CI).

## Spec-only handoff

Cuando ui-designer entrega specs sin código:

## Obligatorio

- [ ] Leer `.agents/design-context.md` si existe
- [ ] Implementar **`component-specs`** tal cual (anatomía, variantes, estados)
- [ ] Usar tokens semánticos (`--color-text-primary`), no hex sueltos
- [ ] Respetar anti-patterns del design-context

## Prohibido

- Reinterpretar layout “a tu estilo”
- Ignorar variantes documentadas
- Crear componente paralelo si el spec nombra primitiva del design system

## Sin handoff formal

Si no hay spec pero hay design-context:

- Usar tokens y tipografía del contexto
- Consultar skill del design system elegido (`design/systems/*`)
- `DEFER: ui-designer` si falta spec crítica para pantalla compleja

## Gate anti-slop

Antes de cerrar PR grande de UI: `./scripts/atelier-detect.sh` en paths tocados.
