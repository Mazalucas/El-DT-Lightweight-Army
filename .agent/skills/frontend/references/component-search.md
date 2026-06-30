# Component search (frontend)

Buscar en este orden antes de crear `NewComponent.tsx`.

## Rutas típicas

| Tipo | Paths |
|------|-------|
| UI primitivas | `components/ui/`, `ui/`, `@/components/` |
| Features | `features/`, `modules/`, `pages/` |
| Hooks | `hooks/`, `lib/hooks/` |
| Utils | `lib/`, `utils/` |
| Styles | tokens CSS, `tailwind.config`, theme |
| Layouts | `layouts/`, `components/layout/` |

## Preguntas

- ¿Existe `Button`, `Card`, `Modal`, `Input` en el design system?
- ¿Hay página similar que copie estructura de layout?
- ¿Existe hook para fetch/auth/form del dominio?

## Extender vs nuevo

| Señal | Acción |
|-------|--------|
| Mismo markup, otro label | Props `variant`, `children` |
| Subparte nueva de card existente | Slot o subcomponente exportado |
| Lógica compartida | Hook extraído o extendido |

## Design system del repo

Detectar: shadcn (`components/ui`), MUI imports, Chakra, etc. — **usar primitivas del stack**, no instalar paralelo sin razón.
