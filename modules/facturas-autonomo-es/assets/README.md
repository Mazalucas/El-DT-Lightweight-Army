# Assets — documentos base

## Dónde poner tus archivos

| Carpeta | Contenido | ¿En Git? |
|---------|-----------|----------|
| [templates/](templates/) | Plantillas de factura (Word, PDF, Excel, ODT) **sin datos personales rellenados** | Sí, si son plantillas vacías o anonimizadas |
| `local/` (crear si hace falta) | Datos fiscales reales, facturas emitidas, IBAN, NIF | **No** — gitignored |
| `assets/local/export-config.json` | Ruta Google Drive para export | **No** — copiar desde [export-config.example.json](../export-config.example.json) |

## Qué subir primero

Copiá o arrastrá aquí los documentos que ya usás:

- Plantilla de factura (la que rellenás a mano hoy)
- Ejemplo de factura ya emitida (**anonimizada**: tapá NIF, importes reales de clientes si preferís)
- Listado de clientes habitual (CSV/Excel), si existe
- Cualquier instructivo de tu gestoría

## Convención de nombres

```text
templates/
├── factura-plantilla.docx      # plantilla principal
├── factura-ejemplo-anon.pdf    # referencia visual
└── clientes-ejemplo.csv        # opcional
```

## Siguiente paso con la IA

Cuando los archivos estén aquí, pedí: *"Analizá las plantillas en facturas-autonomo-es y proponé el modelo de datos"*.
