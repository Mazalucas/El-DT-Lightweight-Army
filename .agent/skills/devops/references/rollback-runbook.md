# Rollback runbook

## Antes de deploy

- [ ] Runbook en `docs/06_operations/` existe → enlazarlo
- [ ] Versión anterior identificable (tag, commit, Firebase release)
- [ ] Rollback de rules/indexes considerado si el deploy los tocó

## Estrategias (elegir según repo)

| Tipo | Rollback |
|------|----------|
| Firebase Hosting | Redeploy commit anterior o rollback en console |
| Cloud Functions | Redeploy versión previa desde CI manual workflow |
| Firestore rules | Revert commit + `firebase deploy --only firestore:rules` |
| Container | Rollback revisión Cloud Run |

## Template de procedimiento

1. Detener tráfico nuevo (si aplica)
2. Identificar último good commit / release ID
3. Ejecutar deploy revert (comando del runbook existente)
4. Verificar smoke test
5. Post-mortem pulse si incidente

## Reutilizar

No escribir rollback desde cero si `docs/06_operations/` ya tiene runbook — **extender** el documento.
