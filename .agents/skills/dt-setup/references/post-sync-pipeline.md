# Post-sync pipeline — mantenedores

Usar en **modo repair** de `dt-setup` y (cuando aplique) post-`/actualizar` guiado. Requiere **Ruby** en la máquina.

## Comandos (orden fijo)

```bash
./scripts/sync-ide.sh
./scripts/sync-commands-from-meta.sh
./scripts/sync-skills-parity.sh
ruby scripts/sync-catalog.rb
./scripts/dt-doctor.sh
```

## Si Ruby no está disponible

- Reportar que el **clone trae estructura pre-generada** en Git; el usuario puede trabajar con `/bienvenida` + `/yo`.
- Sugerir instalar Ruby solo a maintainers o pedir ayuda al equipo platform.

## Loop orden continuo

- Si `dt-doctor` falla → corregir según salida → repetir pipeline (máx. 5 iteraciones, regla `07-orden-continuo`).
- No tocar `vitals/ops/session.yaml`, `.env`, credenciales.

## Fuente de verdad

- IDEs: `vitals/config/ide-targets.yaml`
- Reglas: `vitals/specs/rule-bodies/` + `vitals/config/rules-manifest.yaml`
- Commands: `vitals/config/commands-meta.yaml`
- Skills: `.cursor/skills/` (canónico)
