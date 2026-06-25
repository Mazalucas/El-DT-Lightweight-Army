# Discover before create

Checklist antes de proponer archivos nuevos. Completar la capa que aplique.

## General (todas las capas)

- [ ] Buscar por nombre de concepto (`grep` / búsqueda semántica en el repo)
- [ ] Revisar `README`, `docs/04_architecture/`, ADRs en `docs/05_decisions/`
- [ ] Revisar `.agents/design-context.md` y `.agents/engineering-stack.md` si existen
- [ ] Confirmar que no hay módulo paralelo (`*2`, `*Copy`, `*New`)

## Backend (`arquitecto`)

- [ ] `functions/`, `backend/`, `api/`, `server/`
- [ ] Handlers Cloud Functions existentes — ¿extender vs nuevo entrypoint?
- [ ] `firestore.rules`, `firestore.indexes.json`
- [ ] Services, repositories, validators compartidos
- [ ] Schemas/types compartidos (`types/`, `shared/`)

## Frontend (`frontend`)

- [ ] `components/`, `ui/`, `hooks/`, `lib/`
- [ ] Design system del repo (shadcn, MUI, tokens CSS)
- [ ] Handoff Atelier: `component-specs`, `.agents/design-context.md`, tokens
- [ ] Layouts y patterns ya usados en páginas similares

## DevOps (`devops`)

- [ ] `.github/workflows/`, `cloudbuild*`, scripts en `package.json`
- [ ] `firebase.json`, targets de deploy, `Dockerfile*`
- [ ] Módulos Terraform/Pulumi reutilizables
- [ ] Runbooks en `docs/06_operations/`

## QA (`qa`)

- [ ] `**/*.test.*`, `**/*.spec.*`, `tests/`, `__tests__/`
- [ ] Factories, fixtures, mocks, page objects, test helpers
- [ ] Config de test compartida (`vitest.config`, `jest.setup`)

## Remotion (`remotion-producer`)

- [ ] [`tools/remotion/primitives/`](../../../../tools/remotion/primitives/) — motion, overlays, clay
- [ ] [`tools/REGISTRY.md`](../../../../tools/REGISTRY.md) — catálogo tools
- [ ] Composiciones en `src/`, `Root.tsx`
- [ ] Primitivas en `src/components/remotion/` (copiadas del toolkit o propias)
- [ ] Assets en `public/` (`staticFile`)
- [ ] Reglas en `.cursor/skills/remotion-best-practices/rules/` — no reimplementar

## Si no encontrás nada

Documentar en la entrega: qué buscaste y por qué crear nuevo es necesario.
