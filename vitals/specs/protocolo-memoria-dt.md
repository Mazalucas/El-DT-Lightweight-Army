# Protocolo de memoria sugerida (opt-in)

## Objetivo

Capturar **patrones repetidos** de decisión o preferencia del equipo para proponer allowlists o directivas, **sin auto-aplicar** cambios a reglas del IDE.

## Ubicación

- Propuestas pendientes: `vitals/memory/inbox/`
- Historial aprobado: `vitals/memory/accepted/`

## Formato sugerido (inbox)

Un archivo por propuesta, con frontmatter YAML:

```yaml
---
id: MEM-YYYYMMDD-NNN
status: proposed
pattern_summary: "Cuando el usuario pide X, preferimos flujo Y"
evidence:
  - pulse_id: dt-20260419-001
  - commit: abc1234
suggested_allowlist: "Texto o diff sugerido para una rule futura"
risk: "Qué se podría romper si se aplica ciegamente"
created: 2026-04-19
---
```

## Umbral de repetición

Por defecto documentado: **N = 3** ocurrencias del mismo tipo de tarea con la misma decisión, **siempre** con `evidence[]` no vacío (pulse, commit o cita explícita). El número es ajustable por el equipo en el frontmatter de una propuesta agregada.

## Flujo de promoción

1. El DT (o subagente) propone escribir `inbox/` y **pregunta** al usuario.
2. Si el usuario **rechaza**, no se crea archivo o se marca `status: rejected`.
3. Si el usuario **aprueba la propuesta**, se copia a `accepted/` con `status: accepted` y fecha.
4. La **aplicación** a `.cursor/rules/` o User Rules es un paso explícito aparte (commit humano o Agent con confirmación).

## Prohibiciones

- No escribir secretos en propuestas.
- No promover a `accepted/` sin confirmación explícita en el hilo.
