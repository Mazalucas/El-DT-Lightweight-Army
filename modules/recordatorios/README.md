# Recordatorios

Herramienta local de **recordatorios** con categorías (personal, trabajo, proyectos del catálogo), tags, fechas y **captura dual**: app web + comando Cursor.

## Estado

`active` — app en [`src/`](src/).

## Inicio rápido

| Acción | Command |
|--------|---------|
| Abrir app | **`/recordatorios`** |
| Crear desde chat | **`/recordatorio comprar leche mañana @personal #casa`** |

Manual:

```bash
./scripts/dev-recordatorios.sh
# → http://localhost:5181/
```

## Arquitectura

```text
modules/recordatorios/
├── config/          # semillas YAML (Git)
├── bridge/          # contrato inbox chat → app
├── .local/          # cola JSONL (gitignored)
└── src/
    ├── core/        # dominio puro
    ├── ports/       # interfaces
    ├── adapters/    # Dexie, fetch API, backup
    ├── app/         # composition root
    └── ui/          # interfaz
```

**Fuente de verdad:** IndexedDB en el navegador.  
**Cola chat:** `.local/inbox.jsonl` → drenada por la app vía API dev de Vite.

## Categorías

- **Builtin:** personal, trabajo (`config/categories.seed.yaml`)
- **Proyecto:** auto desde `vitals/catalog/modules.yaml` (`proyecto:{id}`)
- **Custom:** futuro — IndexedDB

## Datos sensibles

- Recordatorios → IndexedDB + `.local/` — **no commitear**
- Backup JSON → export manual desde la app

## Scripts

| Comando | Uso |
|---------|-----|
| `npm run dev` | Desarrollo (puerto 5181) |
| `npm run test` | Tests en `core/` |
| `npm run build` | Build estático |

## Related

- Guía: [docs/02_guides/recordatorios-quickstart.md](../../docs/02_guides/recordatorios-quickstart.md)
- Bridge: [bridge/README.md](bridge/README.md)
