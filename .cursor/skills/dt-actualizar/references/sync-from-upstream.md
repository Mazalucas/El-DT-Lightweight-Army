# Apply — sync desde tag dt-upstream

Gate duro: dry-run → confirmación explícita → apply. Ver [`../../../vitals/specs/precedence.md`](../../../vitals/specs/precedence.md).

Manifiesto de paths: [`sync-paths.md`](sync-paths.md).

## Pre-requisitos

- `vitals/config/dt-upstream.md` con `mode: consumer`
- Remote `dt-upstream` configurado
- `git status` limpio — si no → `/guardar` o stash

## 1. Tag objetivo

Versión indicada por el usuario o la detectada en Fase B de `/actualizar` (`framework_version` remota). Formato tag: `vX.Y.Z`.

## 2. Dry-run (obligatorio)

```bash
git fetch dt-upstream tag vX.Y.Z
```

Para cada path del manifiesto (menos exclusiones y `preserve_paths`):

```bash
git diff --name-only HEAD dt-upstream/vX.Y.Z -- <path>
```

Listar todos los archivos que cambiarían. Destacar colisiones en `docs/` custom.

## 3. Confirmación

Pedir OK explícito al usuario. Sin OK → detener.

## 4. Apply

Por cada **directorio/archivo incluido** del manifiesto (lotes OK):

```bash
git checkout dt-upstream/vX.Y.Z -- <path>
```

No tocar paths excluidos ni `preserve_paths`.

Actualizar frontmatter de `vitals/config/dt-upstream.md`: `framework_version: "X.Y.Z"`.

## 5. Post-sync

- Ruby disponible → [`../../dt-setup/references/post-sync-pipeline.md`](../../dt-setup/references/post-sync-pipeline.md)
- `./scripts/dt-doctor.sh` (script de **verificación** del repo, no lógica de sync)

## 6. Entrega

Versión anterior → nueva, resumen de archivos, doctor, **siguiente paso: `/guardar`**.
