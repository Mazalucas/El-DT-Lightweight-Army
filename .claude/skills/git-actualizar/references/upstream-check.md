# Fase B — consulta upstream DT (solo lectura)

Ejecutar **después** de Fase A. **No** hacer checkout ni merge. Ofrecer `/actualizar-dt` si hay versión nueva.

## Cuándo omitir (SKIP)

Omitir Fase B (silencio o una línea) si:

1. No existe `vitals/config/dt-upstream.md`.
2. Frontmatter `mode: canonical`.
3. No existe remote `dt-upstream` (ni URL en frontmatter `source.url` legacy).
4. `origin` y `dt-upstream` apuntan al **mismo** repo (clone directo del template — Fase A alcanza).

## Snooze

Si `vitals/ops/dt-upstream-state.md` tiene `snooze_until` **posterior a ahora** → omitir con: *"Aviso DT pospuesto hasta …"*.

## Pasos (bash — la IA los ejecuta)

1. Leer versión local desde frontmatter de `vitals/config/dt-upstream.md` → campo `framework_version`. Fallback: archivo `VERSION` en raíz.

2. Obtener versión remota (intentar en orden):

   ```bash
   git ls-remote --tags dt-upstream 'v*'
   ```

   Tomar el tag `vX.Y.Z` semver más alto.

   **Mantenedores del template:** cada release publicada debe taguear `vX.Y.Z` en el commit que actualiza `VERSION` (paso en skill `git-guardar` → `./scripts/dt-tag-version.sh --push`). Sin tag, los consumidores no ven la release en esta consulta.

   Si no hay tags:

   ```bash
   git fetch --depth=1 dt-upstream main
   git show dt-upstream/main:VERSION
   ```

   (Usar `source.ref` del frontmatter si no es `main`.)

3. Comparar semver (X.Y.Z). Ignorar prefijo `v`.

4. Reportar:

   | Resultado | Mensaje |
   |-----------|---------|
   | Igual o local mayor | `Framework DT: al día (vX.Y.Z)` |
   | Remoto mayor | `Hay DT vNuevo (tenés vLocal). ¿Actualizás? → /actualizar-dt` |
   | Red / error | Una línea; **no bloquear** Fase A |

5. Actualizar `vitals/ops/dt-upstream-state.md`: `last_check: <ISO8601 now>`. **No commitear.**

## No hacer

- No invocar scripts Ruby.
- No `--apply` ni `git checkout` desde `/actualizar`.
