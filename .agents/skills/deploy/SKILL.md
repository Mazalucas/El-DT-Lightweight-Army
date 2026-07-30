---
name: deploy
description: "[Trabajo] Desplegar la app del proyecto — primera ejecución autocompleta la config desde el repo; luego sigue vitals/config/deploy.yaml. Use when the user invokes /deploy or wants to publish to production/staging."
---

# deploy

Skill **genérico**: la primera vez descubre cómo se despliega **este** proyecto y materializa la config; las siguientes ejecuciones la siguen.

**No confundir con:** subagente `devops` (diseño de pipelines) · `/github-save-small` (release del template DT).

## Pre-requisitos

1. Sesión válida — `vitals/ops/session.yaml` con `operator.id`; si falta → **`/yo`**.
2. Working tree razonablemente limpio en paths de deploy (build artifacts no commiteados).
3. Secretos **nunca** en el repo — Firebase Secrets, Cloud Run env, etc. (regla `90-seguridad-secrets`).

## Modo de operación

Leer `vitals/config/deploy.yaml` (plantilla: [`vitals/config/deploy.yaml.example`](../../../vitals/config/deploy.yaml.example)).

| Estado | Acción |
|--------|--------|
| Archivo **ausente** o `initialized: false` | **Bootstrap** (sección abajo) — no ejecutar deploy real hasta confirmación |
| `initialized: true` | **Ejecutar** según `deploy.yaml` + [`references/project-deploy.md`](references/project-deploy.md) si existe |

## Bootstrap — primera ejecución de `/deploy`

Objetivo: que la IA **complete** la skill con lo que este repo ya tiene (o debería tener).

1. **Discover** (solo lectura):
   - Docs: `docs/DEPLOY.md`, `docs/**/deploy*.md`, README sección deploy
   - Infra: `firebase.json`, `.firebaserc`, `Dockerfile`, `cloudbuild.yaml`, `.github/workflows/*deploy*`
   - Scripts: `package.json` (`scripts.deploy*`, `scripts.build`), monorepo en `apps/*`, `frontend/`, `backend/`
   - Stack default DT: [`vitals/data/engineering/web-stack.yaml`](../../../vitals/data/engineering/web-stack.yaml) · regla `08-stack-web-default`
   - Referencia Firebase: skill `devops` → [`devops/references/firebase-deploy.md`](../devops/references/firebase-deploy.md)

2. **Inferir** plataforma principal (`firebase` | `cloud-run` | `vercel` | `docker` | `custom`) y entornos (`production`, `staging`, …).

3. **Generar** (pedir confirmación antes de escribir):
   - `vitals/config/deploy.yaml` — desde example, `initialized: true` tras OK del operador
   - `.cursor/skills/deploy/references/project-deploy.md` — usar plantilla [`references/project-deploy.template.md`](references/project-deploy.template.md)

4. **Contenido mínimo de `project-deploy.md`:** prerequisitos CLI, orden de comandos, `--only` / targets, secrets, rollback en una línea, checklist post-deploy.

5. **Buenas prácticas** (incluir en el doc generado):
   - Build local o CI antes de deploy; no `--force` en prod sin acuerdo
   - Predeploy hooks en `firebase.json` reutilizados, no scripts duplicados
   - Un workflow CI por entorno si ya existe — extender, no clonar
   - Verificar health/smoke tras deploy (URL, función ping, etc.)
   - Rollback: tag/commit anterior + redeploy (ver `devops/references/rollback-runbook.md`)

6. Tras confirmación del operador → escribir archivos → **incluir en el próximo commit** (`/guardar`) `vitals/config/deploy.yaml` y `references/project-deploy.md` **antes** de deploy a producción → ofrecer ejecutar deploy del entorno indicado.

**Regla:** deploy reproducible = config versionada en Git; no desplegar a prod con bootstrap solo local.

**Gate duro:** cambios en remotes, borrado de recursos, `firebase deploy` a prod sin confirmación explícita.

## Ejecutar deploy (config inicializada)

1. Releer `vitals/config/deploy.yaml` y `references/project-deploy.md`.
2. Confirmar entorno (`production` por defecto; preguntar si hay varios).
3. Ejecutar en orden:
   - `pre_deploy` (lint, test, build)
   - comando(s) del entorno
   - `post_deploy` (smoke, invalidación CDN, etc.)
4. Capturar salida; si falla → no declarar éxito; sugerir rollback según runbook.
5. **Versión:** si el deploy incluye bump de versión de app, coordinar con `/guardar` (versión **del proyecto**, no del DT).

## Entrega

- Entorno desplegado + comando(s) ejecutados
- URL o recurso resultante
- Si fue bootstrap: paths escritos y qué falta (secrets, CI, DNS)
- **Puntos ciegos:** drift entre doc y scripts, secrets faltantes, deploy manual no reproducible

## Referencias

- Checklist bootstrap: [`references/bootstrap-checklist.md`](references/bootstrap-checklist.md)
- Plantilla doc proyecto: [`references/project-deploy.template.md`](references/project-deploy.template.md)
- Example config: [`vitals/config/deploy.yaml.example`](../../../vitals/config/deploy.yaml.example)
