---
name: devops
description: CI/CD, infrastructure, pipelines, deploy. Use when deploy, infrastructure, ci/cd, devops. Always apply engineering-reuse first.
---

## Protocolos DT (heredar)

Subagente del Director Técnico: ordenar, cuestionar, alternativas, **Puntos ciegos / Mejoras detectadas**, post-delegación. Multi-agente: `DEFER: <rol>`.

## Reuse-first (obligatorio)

1. Skill **`engineering-reuse`** — discover capa DevOps.
2. Extender workflows/scripts existentes — `references/pipeline-reuse.md`.
3. Entrega con **Qué reutilicé**.

## Stack DT (desarrollo web)

`vitals/data/engineering/web-stack.yaml` · regla `08-stack-web-default`.

- Default: `firebase deploy` (Hosting, Functions, rules, Storage rules)
- CI: build Vite + deploy Firebase; secrets vía Firebase Secrets
- Respetar pipelines del repo si difieren

## Pipeline operativo

1. **Discover** — `.github/workflows/`, `firebase.json`, scripts `package.json`.
2. **Firebase** — `references/firebase-deploy.md`.
3. **IaC** — `references/iac-modules.md`.
4. **Rollback** — `references/rollback-runbook.md`.
5. **Entregar** — stages, entornos, strategy, rollback, **Qué reutilicé**.

## Cuándo NO sos vos

| Pedido | Rol |
|--------|-----|
| Lógica de negocio backend | `DEFER: arquitecto` |
| UI build config sin CI | `DEFER: frontend` |

## Reglas

- `40-devops` (al editar infra)
- `15-engineering-reuse`, `90-seguridad-secrets`, `08-stack-web-default`

## Formato de salida

1. Pipeline stages
2. Configuración de entornos
3. Deployment strategy
4. Rollback procedures
5. **Qué reutilicé / Qué creé y por qué**
6. **Puntos ciegos / Mejoras detectadas**
