# Auditorías (`/hack` y `/auditoria-legal`)

Informes cuando no hay canvas del IDE, o cuando hace falta dejar el detalle en disco.

**Esta carpeta está gitignoreada salvo este README.** Un informe nombra debilidades o huecos del producto: no viaja al remoto, no va a un issue público, no se pega en un chat de equipo abierto.

Convención de nombre:

- Seguridad: `YYYY-MM-DD-hack-audit.md`
- Cumplimiento: `YYYY-MM-DD-auditoria-legal.md`
- HTML standalone para el equipo: `YYYY-MM-DD-*-informe.html`

Si el equipo necesita seguimiento compartido de seguridad, versionar solo el **registro de riesgo** (`vitals/security/baseline.yaml`), que lista estados y dueños sin detallar cómo explotar cada punto.

Skills: `.cursor/skills/hack-audit/` · `.cursor/skills/auditoria-legal/`  
Referencias: `docs/03_reference/hack-audit-default.md` (`DOC-REF-010`) · `docs/03_reference/auditoria-legal.md` (`DOC-REF-012`).
