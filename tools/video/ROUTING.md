# Video — qué carril usar

Fuente de decisión para cualquier video dentro de El DT. La lee la skill `video-routing` antes de producir.

Recordly, Hyperframes, Remotion y `/brag` conviven. Ninguno es el motor por defecto. Una skill global que diga “Hyperframes es el framework de salida” cede ante esta matriz.

## Orden (gana la primera fila que cierra)

| # | Situación | Carril | Quién ejecuta |
|---|-----------|--------|----------------|
| 0 | La persona nombró `/recordly`, `/recordingly`, `/brag` o `/remotion` | Ese command | La skill de ese command. Si el brief no entra en el carril, decilo en una línea y proponé el que sí entra. |
| 1 | Hace falta imagen filmada o generada (B-roll, plano hero) y el producto en pantalla no es el sujeto | Footage IA (Veo, Sora, Runway, Kling, Seedance, Hailuo, Pika) | `marketing-strategist` con `marketing/video` |
| 2 | Hace falta una persona que habla a cámara | Avatar (HeyGen, Synthesia) | `marketing-strategist` con `marketing/video` |
| 3 | Ya hay un video largo y hay que cortarlo | Edición (Descript, Opus Clip, CapCut) | `marketing-strategist` con `marketing/video` |
| 4 | Hay que grabar el producto corriendo: clics, cursor, ventana, walkthrough o GIF del flujo real | **Recordly** | Skill `recordly` (`/recordly`). La persona graba en la app. No reconstras la UI en `/brag`, Hyperframes ni Remotion. |
| 5 | El sujeto es el proyecto o sitio de este workspace, el destino es compartirlo, alcanza con 15–25 s, y es una pieza de una vez (tono, música, texto de post) | **`/brag`** | Skill `brag`. El render lo hace Hyperframes por debajo; no abras el flujo genérico de Hyperframes ni un proyecto Remotion. |
| 6 | Composición en HTML que no es ese clip: explainer a medida, recorrido de un PR, slideshow, captions sobre footage, pieza al ritmo de una canción, motion de menos de 10 s, o un lanzamiento de más de 25 s | **Hyperframes** | `npx hyperframes` en el proyecto del video. Skills de Hyperframes en la máquina del operador, no en este repo. |
| 7 | El video es un asset que se mantiene: props, sistema de marca en React, lote o datos, 3D, primitivas de `tools/remotion/`, Studio o Lambda, variantes de ads | **Remotion** | `remotion-producer` · `/remotion` |

Texto sobre imagen generada (títulos, logos, cifras) se compone en el carril de código que haya salido, no dentro del modelo de footage.

## Qué es cada carril

| Carril | Qué es |
|--------|--------|
| Recordly | App de escritorio [Recordly](https://github.com/webadderallorg/Recordly): graba la pantalla del producto y la pule (zoom, cursor, marco, MP4 o GIF). La persona opera la app. |
| `/brag` | Receta de [latent-spaces/brag](https://github.com/latent-spaces/brag): lee el proyecto, elige tono, entrega `brag-output/` con plan, `brag.mp4`, poster y copy para compartir. Hyperframes renderiza por debajo. |
| Hyperframes | Motor HTML de [HeyGen](https://hyperframes.heygen.com/). CLI: `npx hyperframes`. Un carril, al mismo nivel que Remotion. |
| Remotion | Motor React en [`tools/remotion/`](../remotion/), para el asset que se mantiene. Gratis para equipos de hasta 3 personas; equipos más grandes necesitan licencia de empresa. |

## Peso

`/brag` no se vendorea. El repo upstream pesa decenas de MB (música, SFX, ejemplos, sitio). En El DT vive el criterio y un instalador.

Recordly tampoco. El fuente pesa cientos de MB y es AGPL. En El DT vive el criterio. El binario oficial (~180 MB en Mac) se baja a `output/.cache/recordly/` la primera vez, fuera de Git.

La primera vez que el carril es `/brag`:

```bash
./tools/video/install-brag.sh
```

Eso deja solo `skills/brag/` en `output/.cache/brag/` (gitignored). No entra al clone. No se copia a `.cursor/skills/`. Después se sigue el `SKILL.md` de esa caché.

La primera vez que el carril es Recordly y no hay app instalada:

```bash
./tools/video/install-recordly.sh
```

Eso baja el instalador oficial. No clona el repo. La persona lo abre y graba. Proyectos `.recordly`, MP4 y GIF van a `output/recordly/` (gitignored).

Hyperframes no se agrega al `package.json` del DT. El render usa `npx hyperframes`. Node.js 22+ y FFmpeg en el `PATH`.

## Handoff

1. `marketing-strategist` nombra el carril y el motivo en una línea.
2. Carril Remotion → `remotion-producer`.
3. Carril Recordly → skill `recordly`. Lista de tomas, y la persona graba. Si falta la app, `./tools/video/install-recordly.sh`.
4. Carril `/brag` → skill `brag` (instalá la caché si falta el `SKILL.md`).
5. Carril Hyperframes → composición en el proyecto del video, sin scaffold Remotion.
6. Footage, avatar o corte → se queda en `marketing/video`.
