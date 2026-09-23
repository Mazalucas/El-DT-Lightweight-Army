---
name: brag
description: >
  Clip de lanzamiento de 15–25s del proyecto actual, con tono, música y texto
  para compartir. Use when the user says /brag, "let's brag", "launch video",
  or the video-routing lane is brag. Installs upstream latent-spaces/brag into
  a gitignored cache. Do not vendor that repo into El DT. Do not render this
  lane in Remotion.
---

# /brag

Receta de lanzamiento. El motor de pixels es Hyperframes, llamado por la skill upstream. El DT no copia ese repo.

## Cuándo es este carril

El sujeto es el proyecto o sitio de este workspace, el clip dura 15–25 s, y la entrega incluye tono, música y texto para postear. Si hay que grabar la app corriendo, el carril es `recordly`. Si el pedido es una plantilla React, un lote, un explainer largo o footage generado, volvé a [`tools/video/ROUTING.md`](../../../tools/video/ROUTING.md) y cambiá de carril.

Un `/brag` explícito confirma este carril. Si el brief no entra, decilo en una línea y nombrá el carril que sí entra.

## Instalar sin engordar el repo

Si no existe `output/.cache/brag/skills/brag/SKILL.md`:

```bash
./tools/video/install-brag.sh
```

Eso baja solo `skills/brag/` (la receta y su audio) a `output/.cache/brag/`, que Git ignora. No clones el repo completo. No copies la skill a `.cursor/skills/`, `.agents/skills/` ni `.claude/skills/`.

## Producir

1. Leé `output/.cache/brag/skills/brag/SKILL.md` y seguilo, incluidos `references/` de esa caché.
2. La salida queda en `brag-output/` (o la variante con timestamp que pida la skill upstream). No la commitees.
3. Node.js 22+ y FFmpeg en el `PATH`. El render usa `npx hyperframes` dentro de la composición. No agregues Hyperframes al `package.json` del DT.
4. Si la skill upstream pide skills de Hyperframes y no están en la máquina, instalalas a nivel usuario. No las dejes dentro de este repo para commitear.

## Entrega

Plan, `brag.mp4`, poster y copy para compartir, más la ruta de la caché usada. Si la instalación falló, mostrá el error y no reescribas el workflow en Remotion.
