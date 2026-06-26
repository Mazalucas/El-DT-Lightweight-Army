# Apps locales

Proyectos que viven **fuera del catálogo versionado** de `modules/`. No se commitean: datos fiscales, emisor, clientes e historial de facturas.

## `facturas/` — Facturas autónomo (España)

| Campo | Valor |
|-------|--------|
| ID catálogo | `facturas-autonomo-es` |
| Arrancar | **`/nueva-factura`** o `./scripts/dev-facturas-autonomo.sh` |
| Dev URL | `http://localhost:5173/` |

Si la carpeta no existe en tu clone, copiá la app desde backup local o pedí al DT el scaffold. El catálogo en `vitals/catalog/modules.yaml` apunta aquí con `status: local`.

**Separada de Cerebro App** — la SPA cloud (`modules/cerebro-app`) ya no incluye facturación; usá esta app standalone.
