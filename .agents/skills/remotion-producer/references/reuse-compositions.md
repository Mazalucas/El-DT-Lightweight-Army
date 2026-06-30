# Reuse compositions (Remotion)

## Orden de búsqueda

1. [`tools/remotion/primitives/`](../../../../tools/remotion/primitives/) — kit genérico del DT (motion, captions, clay)
2. Composiciones en `src/Root.tsx` y carpetas `src/` del proyecto consumidor
3. Primitivas ya copiadas en `src/components/remotion/`
4. Reglas vendor en `.cursor/skills/remotion-best-practices/rules/`

## Antes de clonar una escena

- [ ] ¿Existe primitiva en `tools/remotion/primitives/`? → copiar y parametrizar
- [ ] Listar composiciones en `src/Root.tsx` y carpetas `src/`
- [ ] ¿Escena similar con otro título/ratio? → `defaultProps` + `calculateMetadata`
- [ ] ¿Primitiva motion (fade, slide, lower-third) ya existe en `src/components/remotion/`?

## Parametrizar vs duplicar

| Situación | Acción |
|-----------|--------|
| Misma escena, otro copy | `defaultProps` en `<Composition>` |
| Variantes 16:9 y 9:16 | `calculateMetadata` o composición padre + props |
| Beat repetido en reel | `<Sequence>` reutilizando subcomponente |
| Color/logo distinto | Props + tokens de `design-context` |

## Primitivas compartidas

Extraer o reutilizar en `src/components/remotion/`:

- `FadeSlideIn`, `CaptionPanel`, `ClayCharacter` (desde `tools/remotion/primitives/` si aplica)
- Un archivo por primitiva; importar en múltiples composiciones

## Assets

- Un MP4/SRT/png en `public/` — referenciar con `staticFile()`
- No duplicar `logo.png` como `logo-v2.png`

## Reglas vendor

Cargar desde `remotion-best-practices/rules/` en lugar de reimplementar:

- `compositions.md`, `sequencing.md`, `transitions.md`, `parameters.md`

## Entregable

Documentar primitivas de `tools/` vs composiciones del proyecto en **Qué reutilicé**.
