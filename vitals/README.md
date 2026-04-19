# Vitals — telemetría y normativa del DT

`vitals/` es el sistema **autogestionado** de latidos (`pulse`), memoria propuesta (`memory`) y especificaciones canónicas (`specs`) del Director Técnico. Objetivo: **máxima información útil por token** (mismo espíritu que `docs/` y DOC-META-001), sin cargar historial completo en cada turno de chat.

## Lectura rápida

1. **[INDEX.md](INDEX.md)** — Qué archivo abrir según la pregunta.
2. **[specs/protocolo-vitals-ia.md](specs/protocolo-vitals-ia.md)** — Cómo leer, escribir y compactar vitals.
3. **[pulse/current.md](pulse/current.md)** — Puntero al último pulso relevante (siempre corto).

## Árbol

```text
vitals/
  INDEX.md
  README.md          # este archivo
  workspace.yaml.example
  specs/             # normativa canónica (SSOT textual compartida)
  pulse/
    current.md       # puntero + resumen breve
    entries/         # un archivo por evento (append)
    snapshots/       # compactación mensual (propuesta + opt-in)
  memory/
    inbox/           # propuestas de patrón (pendiente usuario)
    accepted/        # historial aprobado (opt-in)
  charter/           # principios no negociables (p. ej. no secretos)
  relay/             # plantillas de handoff entre agentes
```

## Sincronización con IDE (Cursor / Antigravity)

El cuerpo de algunas rules se genera desde `vitals/specs/rule-bodies/` con **[scripts/sync-dt-from-vitals.sh](../scripts/sync-dt-from-vitals.sh)**. Tras editar un `rule-body`, ejecutá el script y commiteá **tanto** `vitals/` como `.cursor/` / `.agent/` en el mismo commit.

## Seguridad

Nunca pegar credenciales, tokens ni datos sensibles en `pulse/` ni `memory/`. Ver [charter/no-secrets.md](charter/no-secrets.md).
