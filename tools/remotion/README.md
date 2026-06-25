# Remotion — toolkit del DT

Video programático con [Remotion](https://www.remotion.dev/) para el subagente **remotion-producer** y el command **`/remotion`**.

**Punto de entrada:** instalá y corré desde **`tools/remotion/`** (el cerebro DT no tiene Remotion en la raíz del repo).

## Quick start (dentro del DT)

```bash
cd tools/remotion
npm install          # instala Remotion vía workspace starter/
npm run dev          # Remotion Studio
npm run lint         # eslint + tsc
```

Render de prueba (salida gitignored bajo `tools/remotion/starter/out/` o `output/`):

```bash
cd tools/remotion
npx remotion render starter/src/index.ts BlankVerticalReel ../../output/remotion/preview.mp4
```

## Licencia

Remotion es gratis para equipos de hasta 3 personas. Equipos más grandes necesitan licencia comercial — ver [remotion.dev/license](https://www.remotion.dev/docs/license).

## Estructura

| Path | Uso |
|------|-----|
| [`package.json`](package.json) | **Entrada npm** — `npm install` / `npm run dev` desde `tools/remotion/` |
| [`starter/`](starter/) | Proyecto Remotion (workspace) — composición `BlankVerticalReel` (1080×1920) |
| [`primitives/`](primitives/) | Componentes genéricos copiables (motion, captions, clay 3D) |
| [`scripts/scaffold.sh`](scripts/scaffold.sh) | Copia starter → destino del consumidor |
| [`scripts/update-vendor-skills.sh`](scripts/update-vendor-skills.sh) | Actualiza `remotion-dev/skills` en `.cursor/skills/` |

## Modelo de capas

```text
El-DT-Lightweight-Army/     ← cerebro DT (sin Remotion en raíz)
  tools/
    remotion/               ← instalás y corrés acá
      starter/              ← proyecto npm (workspace)
      primitives/         ← kit copiable
  output/                   ← renders locales (gitignored)
```

## Flujo recomendado (agente)

1. Leer [`tools/REGISTRY.md`](../REGISTRY.md) y `.cursor/skills/remotion-best-practices/SKILL.md`.
2. Revisar [`primitives/`](primitives/) — copiar lo que aplique antes de crear componentes nuevos.
3. **Dentro del DT:** `cd tools/remotion && npm install && npm run dev`.
4. **Proyecto consumidor** (fuera del template o en `output/`): scaffold si hace falta un clone limpio:

```bash
./tools/remotion/scripts/scaffold.sh output/remotion-project
cd output/remotion-project && npm install && npm run dev
```

4. Componer en el proyecto consumidor (`src/Root.tsx`, `src/compositions/`).
5. Render local:

```bash
npx remotion render src/index.ts BlankVerticalReel ../output/remotion/preview.mp4
```

Los MP4 **no** se versionan en el template; salida en `output/remotion/` (gitignored).

## Configuración incluida (starter)

- `Config.setChromiumOpenGlRenderer("angle")` — evita fallos WebGL en render headless.
- `Config.setJpegQuality(92)` — calidad razonable para reels.
- Tailwind v4 vía `@remotion/tailwind-v4`.

## Primitivas 3D (clay)

Las primitivas en `primitives/clay/` requieren `@remotion/three` y `three` en el proyecto destino. Añadir dependencias al copiar:

```bash
npm install @remotion/three three
npm install -D @types/three
```

Ver [`primitives/README.md`](primitives/README.md).

## Actualizar vendor skills

```bash
./tools/remotion/scripts/update-vendor-skills.sh
./scripts/sync-ide.sh
```
