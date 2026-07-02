#!/usr/bin/env python3
"""verify-csv — verificación numérica determinista de CSV/TSV (regla 16-numeric-grounding).

Solo stdlib: corre en cualquier máquina con python3, sin pandas.
Sumas con Decimal (nunca float para dinero). Exit code 0 = checks OK, 2 = discrepancia.

Uso típico:
  python3 tools/data/verify-csv.py datos.csv
  python3 tools/data/verify-csv.py datos.csv --sum monto --assert-total monto=15000.00
  python3 tools/data/verify-csv.py datos.csv --sum monto --group-by region
  python3 tools/data/verify-csv.py ventas.csv --decimal-comma --sep ";" --duplicates factura_id
"""

import argparse
import csv
import sys
from decimal import Decimal, InvalidOperation

CURRENCY_CHARS = "$€£¥%"


def parse_args(argv):
    p = argparse.ArgumentParser(description="Verificación numérica de CSV/TSV")
    p.add_argument("file", help="Path al CSV/TSV")
    p.add_argument("--sep", default=None, help="Separador de columnas (default: autodetectar)")
    p.add_argument("--encoding", default="utf-8-sig", help="Encoding (default: utf-8-sig)")
    p.add_argument("--decimal-comma", action="store_true",
                   help="Formato europeo: 1.234,56 (miles '.', decimal ',')")
    p.add_argument("--sum", dest="sums", action="append", default=[],
                   metavar="COL", help="Sumar columna (repetible)")
    p.add_argument("--group-by", default=None, metavar="COL",
                   help="Subtotales de --sum por valores de esta columna")
    p.add_argument("--assert-total", dest="asserts", action="append", default=[],
                   metavar="COL=VALOR", help="Check: suma de COL debe dar VALOR (repetible)")
    p.add_argument("--duplicates", default=None, metavar="COL[,COL...]",
                   help="Reportar filas duplicadas por clave")
    p.add_argument("--tolerance", type=Decimal, default=Decimal("0.01"),
                   help="Tolerancia de los asserts (default 0.01)")
    return p.parse_args(argv)


def to_decimal(raw, decimal_comma):
    """Devuelve Decimal o None si el valor no es numérico. No limpia en silencio:
    solo tolera espacios, símbolo de moneda al borde y separadores declarados."""
    v = raw.strip().strip(CURRENCY_CHARS).strip()
    if not v:
        return None
    if decimal_comma:
        v = v.replace(".", "").replace(",", ".")
    else:
        v = v.replace(",", "")
    if v.startswith("(") and v.endswith(")"):  # negativos contables: (123.45)
        v = "-" + v[1:-1]
    try:
        return Decimal(v)
    except InvalidOperation:
        return None


def read_rows(path, sep, encoding):
    with open(path, newline="", encoding=encoding) as f:
        sample = f.read(8192)
        f.seek(0)
        if sep is None:
            try:
                sep = csv.Sniffer().sniff(sample, delimiters=",;\t|").delimiter
            except csv.Error:
                sep = ","
        reader = csv.reader(f, delimiter=sep)
        headers = next(reader, [])
        rows = list(reader)
    return sep, headers, rows


def column_stats(headers, rows, decimal_comma):
    stats = {h: {"empty": 0, "numeric": 0, "text": 0, "sum": Decimal("0"),
                 "min": None, "max": None} for h in headers}
    for row in rows:
        for i, h in enumerate(headers):
            raw = row[i] if i < len(row) else ""
            if not raw.strip():
                stats[h]["empty"] += 1
                continue
            d = to_decimal(raw, decimal_comma)
            if d is None:
                stats[h]["text"] += 1
            else:
                s = stats[h]
                s["numeric"] += 1
                s["sum"] += d
                s["min"] = d if s["min"] is None or d < s["min"] else s["min"]
                s["max"] = d if s["max"] is None or d > s["max"] else s["max"]
    return stats


def col_index(headers, name):
    if name not in headers:
        sys.exit(f"ERROR: columna '{name}' no existe. Columnas: {headers}")
    return headers.index(name)


def main(argv=None):
    args = parse_args(argv)
    sep, headers, rows = read_rows(args.file, args.sep, args.encoding)

    print(f"archivo: {args.file}")
    print(f"separador: {sep!r}  encoding: {args.encoding}  decimal_comma: {args.decimal_comma}")
    print(f"columnas: {len(headers)}  filas de datos: {len(rows)}")

    ragged = [i + 2 for i, r in enumerate(rows) if len(r) != len(headers)]
    if ragged:
        print(f"AVISO: {len(ragged)} fila(s) con distinto número de campos "
              f"(líneas: {ragged[:10]}{'…' if len(ragged) > 10 else ''})")
    dup_headers = [i + 2 for i, r in enumerate(rows) if r == headers]
    if dup_headers:
        print(f"AVISO: header repetido dentro de los datos (líneas: {dup_headers})")

    stats = column_stats(headers, rows, args.decimal_comma)
    print("\nPor columna (vacíos / numéricos / texto):")
    for h in headers:
        s = stats[h]
        line = f"  {h}: vacíos={s['empty']} num={s['numeric']} texto={s['text']}"
        if s["numeric"] and not s["text"]:
            line += f"  suma={s['sum']} min={s['min']} max={s['max']}"
        elif s["numeric"] and s["text"]:
            line += "  MIXTA: revisar separadores o basura en los datos"
        print(line)

    for col in args.sums:
        i = col_index(headers, col)
        total, empties, bad = Decimal("0"), 0, 0
        groups = {}
        for row in rows:
            raw = row[i] if i < len(row) else ""
            d = to_decimal(raw, args.decimal_comma)
            if d is None:
                empties += 1 if not raw.strip() else 0
                bad += 1 if raw.strip() else 0
                continue
            total += d
            if args.group_by:
                g = row[col_index(headers, args.group_by)].strip()
                groups[g] = groups.get(g, Decimal("0")) + d
        print(f"\nSUMA {col} = {total}  (vacíos={empties}, no numéricos={bad})")
        if args.group_by:
            for g in sorted(groups):
                print(f"  {args.group_by}={g}: {groups[g]}")
            parts = sum(groups.values(), Decimal("0"))
            ok = parts == total
            print(f"  check subtotales vs total: {'OK' if ok else f'DISCREPANCIA ({parts} != {total})'}")

    if args.duplicates:
        keys = [k.strip() for k in args.duplicates.split(",")]
        idxs = [col_index(headers, k) for k in keys]
        seen, dups = {}, 0
        for n, row in enumerate(rows, start=2):
            key = tuple(row[i] if i < len(row) else "" for i in idxs)
            if key in seen:
                dups += 1
                print(f"DUPLICADO línea {n}: {key} (primera vez: línea {seen[key]})")
            else:
                seen[key] = n
        print(f"\nDuplicados por ({args.duplicates}): {dups}")

    failed = 0
    for a in args.asserts:
        col, _, expected = a.partition("=")
        i = col_index(headers, col)
        total = sum((d for row in rows
                     if (d := to_decimal(row[i] if i < len(row) else "", args.decimal_comma)) is not None),
                    Decimal("0"))
        exp = Decimal(expected)
        diff = abs(total - exp)
        if diff <= args.tolerance:
            print(f"CHECK OK: suma {col} = {total} ≈ {exp} (diff {diff})")
        else:
            failed += 1
            print(f"CHECK FALLÓ: suma {col} = {total}, esperado {exp} (diff {diff})")

    if failed:
        print(f"\nRESULTADO: {failed} check(s) fallidos — discrepancia a reportar, no acomodar.")
        return 2
    print("\nRESULTADO: OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
