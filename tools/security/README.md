# tools/security

Evidencia determinista para la auditoría de seguridad del DT (`/hack`, subagente `hack-audit`).

## `scan-repo.sh`

Pasada read-only y **sin red** sobre el repo. Nunca imprime el valor de un secreto: solo `path:línea` y el tipo de patrón.

```bash
./tools/security/scan-repo.sh                # pasada estándar (tope 12 por tipo)
./tools/security/scan-repo.sh --full         # sin tope
./tools/security/scan-repo.sh --history      # incluye historial Git (más lento)
./tools/security/scan-repo.sh ../otro-repo   # auditar otro proyecto
```

**Exit codes:** `0` sin señales · `1` señales encontradas · `2` error de uso.

**Salida:** líneas `[TIPO] path:línea — nota` agrupadas por dominio, más un resumen con el conteo, el motor usado (`rg` o `grep`) y el tope aplicado.

### Qué cubre

| Dominio | Tipos |
|---------|-------|
| Secretos | `SECRET-AWS`, `SECRET-GCP`, `SECRET-GITHUB`, `SECRET-SLACK`, `SECRET-STRIPE`, `SECRET-PRIVKEY`, `SECRET-GENERIC`, `SECRET-ENV-TRACKED` |
| Cliente | `CLIENT-SECRET`, `CLIENT-SOURCEMAP` |
| Reglas de acceso | `RULES-OPEN`, `RULES-AUTH-ONLY` |
| Sinks | `SINK-HTML`, `SINK-EVAL`, `SINK-SHELL`, `SINK-CORS`, `SINK-POSTMSG` |
| CI/CD | `CI-PR-TARGET`, `CI-PERMS`, `CI-INJECTION` |
| Agentes / IA | `AGENT-CONFIG`, `AGENT-MANUAL` |
| Historial (`--history`) | `HISTORY-SECRET` |

### Qué NO cubre

No hay análisis de flujo de datos, ni base de CVEs, ni ejecución de la aplicación. **Una señal no es un hallazgo:** la skill `hack-audit` exige trazar origen→sink y descartar controles antes de afirmar una vulnerabilidad (`references/severity-rubric.md`).

Los patrones de *sink* se buscan solo en archivos de código: un README que muestra `eval()` como ejemplo no es una vulnerabilidad. Se excluyen dependencias, artefactos de build, los espejos generados por `sync-ide` (`.claude/`, `.agents/`) y el código vendoreado en `tools/atelier/` — ese último se audita upstream.

Se escanean rutas ocultas (`--hidden` en `rg`) a propósito: sin eso quedaban fuera `.github/workflows/`, `.env*` y `.cursor/**`, que es justo la superficie de CI, secretos y agentes.

## `semgrep/` — taint analysis opcional

Reglas locales (sin red) para las cuatro clases donde seguir el flujo del dato paga: XSS, inyección de comandos, evaluación dinámica y SSRF.

```bash
semgrep --validate --config tools/security/semgrep/    # antes de confiar en ellas
semgrep --config tools/security/semgrep/ --error
```

Es el **nivel 3** del orden de evidencia. Si semgrep no está instalado, la skill lo declara en Cobertura y baja la confianza de esos hallazgos en vez de disimularlo.

## `make-fixtures.sh` — banco de calibración

Genera un proyecto de juguete con **7 vulnerabilidades plantadas** y **5 señuelos** para medir si el auditor respeta la compuerta anti-alucinación.

```bash
./tools/security/make-fixtures.sh          # → output/hack-audit-fixtures/ (gitignoreado)
./tools/security/make-fixtures.sh --clean
```

El código vulnerable **no se versiona**: se genera bajo `output/`. Los "secretos" son valores de ejemplo publicados por los propios proveedores, no credenciales reales.

Método de puntuación y umbrales de aprobación: `.cursor/skills/hack-audit/references/calibration.md`.

## Consumidores

Subagente `hack-audit` · command `/hack` · referencia `docs/03_reference/hack-audit-default.md` (`DOC-REF-010`).
