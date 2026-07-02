# tools/data — verificación numérica

Herramientas deterministas para la regla `16-numeric-grounding`: los números salen de código ejecutado, no del "cálculo mental" de la IA.

| Tool | Runtime | Uso |
|------|---------|-----|
| [`verify-csv.py`](verify-csv.py) | `python3` (solo stdlib, sin pandas) | Perfil de CSV/TSV, sumas con `Decimal`, subtotales por grupo, duplicados y asserts de totales |

## Uso rápido

```bash
python3 tools/data/verify-csv.py datos.csv
python3 tools/data/verify-csv.py datos.csv --sum monto --assert-total monto=15000.00
python3 tools/data/verify-csv.py datos.csv --sum monto --group-by region
python3 tools/data/verify-csv.py ventas.csv --decimal-comma --sep ";" --duplicates factura_id
```

Exit code `0` = checks OK · `2` = discrepancia (reportar, no acomodar).

Consumidores: subagente **data-auditor** (`.cursor/skills/data-auditor/`), command `/verificar`. Referencia: `docs/03_reference/numeric-verification-default.md` (`DOC-REF-009`).
