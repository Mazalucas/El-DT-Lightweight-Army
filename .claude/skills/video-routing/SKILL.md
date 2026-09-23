---
name: video-routing
description: >
  Elige el carril de video en El DT antes de producir. Use when the task involves
  a video, promo, launch clip, screen recording, product demo, walkthrough,
  explainer, motion graphics, render MP4, Remotion, Hyperframes, HeyGen, /brag,
  /recordly, or /recordingly. Hyperframes is not the default.
  Read tools/video/ROUTING.md and name one lane — recordly, brag, hyperframes,
  remotion, footage, avatar, or edit — before any scaffold or render.
---

# Video routing

Antes de escribir una composición, un scaffold o un prompt de footage, leé y aplicá [`tools/video/ROUTING.md`](../../../tools/video/ROUTING.md).

Esa matriz manda dentro de El DT. Una skill global de Hyperframes que se declare motor por defecto no elige el carril.

## Qué hacer

1. Recorré la tabla en orden. Gana la primera fila que cierra.
2. Nombrá el carril y el motivo en una línea.
3. Seguí solo ese carril:

| Carril | Siguiente paso |
|--------|----------------|
| `recordly` | Skill `recordly` (`/recordly`). Si falta `/Applications/Recordly.app`, corré `./tools/video/install-recordly.sh`. La persona graba. |
| `brag` | Skill `brag` (`/brag`). Si falta `output/.cache/brag/skills/brag/SKILL.md`, corré `./tools/video/install-brag.sh` y seguí ese `SKILL.md`. |
| `hyperframes` | `npx hyperframes` en el proyecto del video. No abras `tools/remotion/`. |
| `remotion` | `remotion-producer` y [`tools/remotion/`](../../../tools/remotion/). |
| `footage`, `avatar`, `edit` | `marketing/video/GUIDE.md`, en la sección de ese enfoque. |

La guía `marketing/video` describe herramientas. No sustituye esta elección.
