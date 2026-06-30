# Superficie — Dashboard SaaS

**Tipo:** aplicación autenticada — nav lateral o rail + contenido. **No** marketing hero ni pitch scroll.

Placeholders: [`placeholders.md`](placeholders.md) · Protocolo: [`../PROTOCOL.md`](../PROTOCOL.md)

## Wireframe

```text
┌──────────┬──────────────────────────────────────────────────┐
│          │ topbar: welcome · search · acción secundaria      │
│  nav /   ├──────────────────────────────────────────────────┤
│  rail    │ [KPI][KPI][KPI][KPI]                              │
│          ├─────────────────────────────┬────────────────────┤
│          │ chart / tendencia           │ panel actividad      │
│          ├─────────────────────────────┴────────────────────┤
│          │ tabla clientes / transacciones                    │
└──────────┴──────────────────────────────────────────────────┘
```

## Regiones

### Navegación
- Items: `{section_overview}`, `{section_reports}`, `{section_clients}`, `{section_settings}`.
- Material M3: preferir **navigation rail** compacto + FAB opcional.
- Carbon: UI shell oscuro, iconografía IBM Plex.
- Apple: sidebar grouped, separators sutiles.

### Topbar
- Título `{welcome}`.
- Search: `type="search"`, `aria-label="Buscar"`, placeholder "Buscar…".
- Botón `{cta_secondary}` (tonal o outline según DS).

### KPIs (4)
- Reutilizar métricas de placeholders o variantes dashboard.
- Label small caps/muted; value grande tabular; delta opcional en acento/success.

### Chart + panel
- Chart: barras o área con gradiente **del primary** (no purple).
- Panel lateral: lista de actividad reciente (3–5 ítems placeholder).

### Tabla
- Columnas mínimas: cliente, estado, monto/fecha.
- Fila ejemplo: `{table_client}`, `{table_status}`.
- Header con fondo ink o primary según DS.

## Densidad y motion

Escala **8px** (referencia preview `dashboard-shell.css`):

| Elemento | Medida |
|----------|--------|
| Sidebar width | 240–256px (Carbon 256) · M3 rail 80px |
| Nav item | min-height **40px**, padding 0 12px, gap icon 10px |
| Topbar | min-height **64px**, padding 0 24px |
| Search | height **36–40px**, max-width **320px** |
| Botón topbar | height **36px**, padding 0 14px — sin sombra pesada |
| Content padding | **24px**, gap entre bloques **24px** |
| KPI grid gap | **16px** · KPI padding **18px 20px** · value **1.75rem** |
| Panel | padding **20px**, min-height chart **280px** |
| Tabla | cell padding **12px 16px**, hover fila sutil |

- Spacing consistente con tokens del system.
- **Contraste sidebar:** si `--tpl-sidebar-bg` es oscuro, links/hover/active en claro (`--tpl-sidebar-link*`). No reutilizar `--tpl-text` del main. Ver [`contrast-contract.md`](contrast-contract.md).
- **Mobile:** sidebar → drawer con burger en topbar; KPIs en scroll snap horizontal; tabla con scroll. Ver [`responsive-contract.md`](responsive-contract.md).
- Hover sutil en filas; sin bounce/elastic.
- `prefers-reduced-motion`: desactivar animaciones.

## Implementación

Construir el shell de dashboard en el proyecto activo con estos criterios de estructura/espaciado; no versionar ejemplos HTML aquí.

## Anti-slop

- No dashboard que sea solo sidebar + chart vacío sin tabla.
- No mezclar componentes de landing (hero, CTA band).
