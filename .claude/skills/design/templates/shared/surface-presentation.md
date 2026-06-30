# Superficie — Presentación (pitch / reporte)

**Tipo:** documento scroll largo, secciones con **layouts distintos**. **No** usar estructura de landing ni shell de dashboard.

Placeholders: [`placeholders.md`](placeholders.md) · Protocolo: [`../PROTOCOL.md`](../PROTOCOL.md)

## Wireframe global

```text
[nav sticky oscuro — logo + anclas + CTA]
[hero oscuro — kicker · H1 con énfasis · hook · meta]
── sección 1: problema (split asimétrico + stat stack)
── sección 2: solución (visual full-bleed)
── sección 3: mercado + modelo (grid 2 cards)
── sección 4: tracción (KPI row + quote)
── sección 5: producto demo (visual)
── sección 6: roadmap (timeline 4 fases)
── sección 7: equipo + ask (team grid + ask split)
[CTA final oscuro]
[footer]
```

Max content width ~1080px; padding horizontal ~28px; secciones ~88px vertical.

## Paleta en documento

| Rol | Uso |
|-----|-----|
| ink | Nav, hero, footer, headers de tabla — **tintado**, no negro puro |
| paper | Fondo general del documento |
| accent | CTAs en superficie clara, labels de sección |
| accent-dark | Texto/énfasis **sobre fondos oscuros** (hero h1 em, nav hover, monto del ask) |
| accent-soft | Recap boxes, quote background |
| gray | Body secundario |
| line | Bordes de cards y tablas |

**Contraste:** `paper` + `ink` en secciones claras; `ink` + `paper` / `accent-dark` en nav/hero/footer oscuros. Nunca `accent` saturado sobre `ink` sin `accent-dark`. Ver [`contrast-contract.md`](contrast-contract.md).

**Responsive:** nav sticky → burger + drawer; secciones en 1 columna; grids colapsan. Ver [`responsive-contract.md`](responsive-contract.md).

## Secciones (7 layouts distintos)

### Hero
- Fondo `ink` con gradiente sutil hacia acento (profundidad, no mesh purple).
- Kicker: `{kicker}` — chip con borde translúcido.
- H1: `{brand}` con una palabra en `<em>` usando **accent-dark** (legible sobre oscuro).
- Sub: `{hook}`.
- Meta opcional: fecha, versión, contacto.

### 1 · Problema — `split`
- Izquierda: `{problem_title}`, `{problem}`, recap con `{opportunity}`.
- Derecha: stack de 2–3 stat-boxes (números placeholder + label).

### 2 · Solución — `visual-full`
- Título `{solution_title}`, párrafo `{solution}`.
- Bloque full-width para mock/screenshot (`{product_demo}`).

### 3 · Mercado — `grid2`
- Card `{market_label}` / `{market}`.
- Card `{model_label}` / `{model}`.

### 4 · Tracción — `kpi + quote`
- Fila 3–4 KPIs.
- Blockquote `{quote}` + `{quote_author}`.

### 5 · Demo — opcional si no está en §2
- Label `{product_demo_label}` + área visual.

### 6 · Roadmap — `timeline`
- 4 fases Q1–Q4: foco + ítems (ver placeholders).

### 7 · Equipo + Ask — `team` + `ask-split`
- 3 miembros: avatar iniciales, nombre, rol.
- Ask: monto `{ask_amount}` en **accent-dark** sobre panel oscuro; lista `{ask_use}`.

### CTA final
- Panel oscuro, título de cierre, botón claro sobre oscuro (paper bg + accent text).

## Tipografía

- Display y body según design system del `.md` del system.
- Labels de sección: uppercase tracking moderado — **no** abusar en todo el doc.
- `text-wrap: balance` en títulos; `pretty` en párrafos largos.

## Anti-slop

- Mantener aire — no sobrecargar cada sección.
- Variar layouts; no repetir el mismo grid 7 veces.
- Pitch permanece **tema claro** en cuerpo (documento/reporte); hero/footer oscuros OK.
