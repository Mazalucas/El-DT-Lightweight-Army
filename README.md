# Tráfico del repositorio

Histórico armado por `.github/workflows/repo-traffic.yml`. GitHub solo conserva 14 días; esta rama guarda cada día una vez.

- `series/clones.json` y `series/views.json`: un registro por fecha (`count` y `uniques`).
- `series/repo.json`: estrellas, forks y watchers de cada día.
- `snapshots/YYYY-MM-DD/`: referrers y páginas de esa ventana de 14 días.
- `summary.json`: totales de `count`. Los `uniques` no se suman entre días.

Una misma fecha se reemplaza si el workflow corre de nuevo. No se duplica.
