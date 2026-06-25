# Atelier toolkit (El DT)

Capa de sync sobre [Impeccable](https://github.com/pbakaus/impeccable) + extensiones DT.

## Estructura

```text
tools/atelier/
  upstream/          git submodule @ skill-v* tag
  generated/         output sync (no editar a mano)
  overlays/          parches DT (editar aquí)
  scripts/           sync pipeline
  starters/          scaffolds copiables al proyecto activo
  impeccable-lock.yaml
  package.json       pin npm impeccable CLI
```

## Uso (operador)

```bash
cd tools/atelier && npm install   # primera vez
/atelier init
/atelier craft hero
./scripts/atelier-detect.sh src/
```

## Preview demo

Demos HTML para humanos (no workflow IA):

```bash
./tools/atelier/scripts/serve-preview.sh
```

- Hub: comandos y links
- `demos/landing-swiss.html` — landing Swiss-style
- `demos/dashboard-product.html` — shell producto

## Mantenedor — actualizar Impeccable

```bash
./tools/atelier/scripts/sync-from-impeccable.sh --latest
# o pin explícito:
./tools/atelier/scripts/sync-from-impeccable.sh --tag skill-v3.8.0 --cli 3.1.0
```

Luego: `./scripts/sync-ide.sh` y `./scripts/dt-doctor.sh`.

## Instalación CLI (primera vez)

```bash
cd tools/atelier && npm install
```

Ver [ATTRIBUTION.md](ATTRIBUTION.md).
