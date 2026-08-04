# Pulse — puntero actual

**Último pulse_id:** [dt-20260804-003](entries/2026-08-04-dt-20260804-003.md)

**Versión template:** 1.7.11

**Resumen:** `/ordenar` y `/hack` documentados en README (skills, subagente, guías). `hack-audit` ahora es **verificable** — autochequeo de la compuerta (controla también la sobrecorrección), fan-out con contexto compartido y encadenado en el padre, banco de calibración con señuelos (`tools/security/make-fixtures.sh`) y taint opcional con semgrep. El banco descubrió dos defectos del scanner: rutas ocultas sin escanear y sinks buscados en markdown. Previos: endurecimiento (`dt-20260804-002`) y creación del especialista #23 (`dt-20260804-001`).

**Proyecto / contexto Git:** raíz `.` (repo plantilla DT canónica).

---

Instrucciones: los lectores abren **este archivo primero**; el detalle está en `entries/`.
