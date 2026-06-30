# Remotion starter

Plantilla mínima para scaffold con [`../scripts/scaffold.sh`](../scripts/scaffold.sh).

## Contenido (post-implementación)

| Archivo | Propósito |
|---------|-----------|
| `package.json` | Remotion 4.x + Tailwind v4 |
| `remotion.config.ts` | angle GL, jpeg quality 92 |
| `src/Root.tsx` | Registro de `BlankVerticalReel` |
| `src/BlankVerticalReel.tsx` | Placeholder 1080×1920, 30 fps |
| `src/theme.ts` | Tokens de color/tipografía neutros |

## Uso local (después del scaffold)

```bash
cd <destino> && npm install && npm run dev
npx remotion render src/index.ts BlankVerticalReel out/preview.mp4
```

No commitear `node_modules/` ni `out/` en el template DT.
