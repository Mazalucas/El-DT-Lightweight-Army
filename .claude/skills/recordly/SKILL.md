---
name: recordly
description: >
  Grabación de pantalla y demo del producto corriendo, con zoom, cursor y
  export MP4 o GIF. Use when the user says /recordly, /recordingly, screen
  recording, product demo, walkthrough, or the video-routing lane is recordly.
  Points at the official Recordly app. Does not clone the AGPL repo into El DT
  and does not restage the UI in Remotion or /brag.
---

# /recordly

Demo del producto real. [Recordly](https://github.com/webadderallorg/Recordly) graba la ventana y la pule. El DT no copia esa app.

`/recordingly` es el mismo carril.

## Cuándo es este carril

Hay que mostrar la app corriendo: clics, cursor, un flujo, un GIF para el README. Si el pedido es un clip de 15–25 s armado desde el código, una plantilla React o footage generado, volvé a [`tools/video/ROUTING.md`](../../../tools/video/ROUTING.md).

Un `/recordly` explícito confirma este carril. Si el brief no entra, decilo en una línea y nombrá el carril que sí entra.

## App, sin vendorear

Si en macOS no existe `/Applications/Recordly.app`:

```bash
./tools/video/install-recordly.sh
```

Eso baja el instalador oficial a `output/.cache/recordly/` (gitignored). No clones el repo. No hagas `npm install` en el DT. La persona abre el dmg y mueve Recordly a Aplicaciones. En macOS 14+ hace falta el permiso de grabación de pantalla.

## Producir

1. Escribí una lista de tomas: ventana o URL local, pasos a clickear, qué decir, MP4 o GIF, y relación de aspecto.
2. Dejala en el chat y, si hace falta archivo, en `output/recordly/tomas.md` (gitignored).
3. La persona graba y exporta. El agente no aprieta record ni reescribe el flujo en Playwright, Remotion o `/brag`.
4. Si después piden títulos, variantes o un template sobre esa toma, esa segunda pieza sale por el carril de `tools/video/ROUTING.md`.

## Entrega

Lista de tomas, si la app ya estaba instalada o la ruta del instalador en caché, y dónde quedó el export cuando la persona lo tenga. Si la descarga falla, mostrá el error y el link al [release oficial](https://github.com/webadderallorg/Recordly/releases).
