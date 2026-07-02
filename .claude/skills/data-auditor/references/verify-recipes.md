# Recetas de verificación numérica

Recetas por runtime, en orden de preferencia. Detectar primero; no asumir.

## Detección de runtime

```bash
python3 -c "import pandas" 2>/dev/null && echo "pandas" || \
python3 --version >/dev/null 2>&1 && echo "python3" || \
node --version >/dev/null 2>&1 && echo "node" || echo "NONE"
```

`NONE` → modo degradado: todo `[NO VERIFICADO]` + entregar script para que el usuario lo corra.

## Receta 0 — tool del repo (preferida para CSV/TSV)

`tools/data/verify-csv.py` — stdlib puro (corre con cualquier `python3`), sumas con `Decimal`, autodetección de separador, formato europeo (`--decimal-comma`), negativos contables `(500,00)`.

```bash
python3 tools/data/verify-csv.py datos.csv                                  # perfil completo
python3 tools/data/verify-csv.py datos.csv --sum monto --group-by region    # subtotales + check vs total
python3 tools/data/verify-csv.py datos.csv --assert-total monto=15000.00    # exit 2 si no cierra
python3 tools/data/verify-csv.py datos.csv --duplicates factura_id
```

Reuse-first: usar esta tool antes de escribir un script ad-hoc. Las recetas A–C quedan para lo que la tool no cubre (XLSX, joins entre archivos, fórmulas de negocio).

## Receta A — Python + pandas (preferida: CSV, XLSX, TSV)

```python
import pandas as pd

df = pd.read_csv("datos.csv")          # XLSX: pd.read_excel (requiere openpyxl)
# Separadores europeos: pd.read_csv(..., sep=";", decimal=",", thousands=".")

print("filas:", len(df))
print(df.dtypes)                        # columnas numéricas leídas como object = señal de problema
print("vacíos por columna:\n", df.isna().sum())

total = df["monto"].sum()
print("suma monto:", total)

# Cross-check contra total declarado en la fuente
declarado = 15000.00
assert abs(total - declarado) < 0.01, f"DISCREPANCIA: {total} != {declarado}"
```

## Receta B — Python stdlib (sin pandas)

```python
import csv
from decimal import Decimal

filas, total, vacios = 0, Decimal("0"), 0
with open("datos.csv", newline="", encoding="utf-8-sig") as f:
    for row in csv.DictReader(f):
        filas += 1
        v = row["monto"].strip()
        if not v:
            vacios += 1
            continue
        total += Decimal(v.replace(",", ""))  # ajustar según separadores reales

print(f"filas={filas} vacios={vacios} total={total}")
```

Usar `Decimal`, no `float`, para dinero.

## Receta C — Node (sin Python)

```javascript
const fs = require("fs");

const lineas = fs.readFileSync("datos.csv", "utf8").trim().split("\n");
const headers = lineas[0].split(",");
const col = headers.indexOf("monto");

let total = 0, filas = 0, vacios = 0;
for (const linea of lineas.slice(1)) {
  filas++;
  const v = linea.split(",")[col]?.trim();  // no soporta comas entre comillas: validar antes
  if (!v) { vacios++; continue; }
  total += Number(v);
}
console.log({ filas, vacios, total: total.toFixed(2) });
```

Para CSV con campos entrecomillados o XLSX, preferir Python; en Node haría falta dependencia externa (`csv-parse`, `xlsx`).

## Tabla pegada en el chat (sin archivo)

Volcar la tabla **textualmente** a un archivo temporal (`/tmp/datos.csv`) sin retocar valores, y aplicar receta A/B/C. El volcado es copia, no interpretación: cualquier limpieza (separadores, símbolos de moneda) se hace en el script, donde queda visible.

## Cross-checks estándar

| Check | Cómo |
|---|---|
| Total vs suma de partes | Recomputar totales/subtotales declarados; `assert` con tolerancia (0.01 para moneda) |
| Conteo de filas | Filas leídas vs esperadas; detectar headers repetidos y filas en blanco |
| Duplicados | Conteo por clave candidata (`df.duplicated()`) |
| Tipos | Columna numérica que parsea como texto → separadores o basura en los datos |
| Rango | Negativos donde no deberían, outliers evidentes (reportar, no filtrar) |
