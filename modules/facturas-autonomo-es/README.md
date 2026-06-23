# Facturas autónomo (España)

Herramienta web local para **crear facturas de autónomo** en España: formulario guiado, memoria de clientes, dos plantillas (nacional / internacional) y exportación PDF o PNG.

## Estado

`active` — app en [`src/`](src/).

## Inicio rápido

En Cursor: **`/nueva-factura`** — levanta la app en el navegador (Vite).

Manual:

```bash
./scripts/dev-facturas-autonomo.sh
# o
cd modules/facturas-autonomo-es/src && npm run dev
```

Abrí la URL que muestra Vite (normalmente `http://localhost:5173`).

**Primera vez:** la app pide configurar el **emisor** (nombre, NIF, domicilio, IBAN). Esos datos se guardan solo en IndexedDB del navegador, no en Git.

### Exportar a Google Drive

Botón **Exportar a Google Drive**:

1. Elegís mes/año → carpeta `2026 06 - JUNIO` (se crea si no existe)
2. Archivos: `2026 06 - Factura 01.pdf` y `.png`
3. Si es borrador, se emite al confirmar

Ruta: `.../Lucas Mazalán Suárez - Documentos y Facturas/Facturas/` — configurable en `assets/local/export-config.json` (ver [export-config.example.json](assets/export-config.example.json)).

Requiere `npm run dev` (API local de escritura; el build estático no escribe en disco).

## Qué hace

| Función | Detalle |
|---------|---------|
| **Plantillas** | Nacional (IVA 21 % + IRPF 7 %) e internacional (sin IVA, nota legal art. 69) |
| **Clientes** | Autocompletar, guardar y reutilizar |
| **Numeración** | Formato `001 / 2026`, auto-incremento al emitir |
| **Historial** | Abrir, duplicar facturas anteriores |
| **Emitir** | Registra factura emitida + modal para descargar PNG/PDF |
| **Exportar a Google Drive** | Modal con mes/año → guarda PDF+PNG en carpeta Facturas (sync local) |
| **Export** | PDF vía imprimir; PNG descarga local (barra de vista previa) |
| **Nueva factura** | Siguiente número automático en el panel izquierdo |
| **Backup** | Export/import JSON (puente a sync futuro) |

## Plantilla Excel base

Referencia visual: [assets/templates/Modelo-fra-Lucas.xlsx](assets/templates/Modelo-fra-Lucas.xlsx)

## Estructura

```text
modules/facturas-autonomo-es/
├── module.yaml
├── README.md
├── assets/templates/     # Excel base
└── src/                  # App Vite + TypeScript
    ├── app/
    │   ├── models/       # Emitter, Client, Invoice
    │   ├── calc/         # Cálculos IVA/IRPF
    │   ├── storage/      # Dexie (IndexedDB)
    │   ├── templates/    # HTML/CSS factura
    │   └── ui/           # Export, historial, clientes
    └── package.json
```

## Datos sensibles

- Emisor, clientes e historial → **IndexedDB** en el navegador
- Backup JSON → descargá manualmente; no commitear
- Carpeta `assets/local/` (gitignored) reservada para archivos locales opcionales

## Scripts

| Comando | Uso |
|---------|-----|
| `npm run dev` | Desarrollo local |
| `npm run build` | Build estático en `dist/` |
| `npm test` | Tests de cálculo fiscal |

## Catálogo

Registrado como `facturas-autonomo-es` en [vitals/catalog/modules.yaml](../../vitals/catalog/modules.yaml).
