# Primitivas Remotion (genéricas)

Componentes **copiables** al proyecto consumidor. No incluyen guiones, copy de campaña ni assets de producto.

## Instalación en proyecto destino

```bash
# Copiar lo que necesites
cp -R tools/remotion/primitives/motion src/components/remotion/
cp -R tools/remotion/primitives/overlays src/components/remotion/
# Clay 3D (opcional)
cp -R tools/remotion/primitives/clay src/components/remotion/
npm install @remotion/three three
npm install -D @types/three
```

## Contenido

| Carpeta | Componentes | Notas |
|---------|-------------|-------|
| `motion/` | `FadeSlideIn` | Fade + slide con `useCurrentFrame` + `interpolate` |
| `overlays/` | `CaptionPanel` | Panel superior con hasta 3 líneas de caption |
| `clay/` | `ClayCharacter`, `clay-theme` | Personajes clay 3D genéricos (R3F + `@remotion/three`) |

## Convenciones

- Parametrizar colores vía props o `design-context`, no hardcodear marca del DT.
- Motion solo con frame-driven APIs — **sin** CSS `transition`/`animation`.
- Un archivo por primitiva; importar desde composiciones en `src/compositions/`.

Prioridad reuse-first: estas primitivas **antes** de crear duplicados en `src/components/remotion/`.
