# Configuración multi-IDE: Cursor y Antigravity

El DT (Director Técnico) soporta **Cursor** y **Antigravity**. El repositorio incluye configuración para ambos IDEs. Para evitar conflictos, ejecutá el comando de setup del IDE que vas a usar.

## Cuándo ejecutar el setup

- **Al clonar** el repositorio por primera vez
- **Al cambiar de IDE** (por ejemplo, pasás de Cursor a Antigravity)

## Comandos de setup

### Si usás Cursor

Ejecutá el comando `/setup-cursor` en el chat del agente.

**Qué hace:** Elimina las carpetas `.agent/` y `.antigravity/`. Deja solo `.cursor/` para la configuración del DT.

### Si usás Antigravity

Ejecutá el workflow `/setup-antigravity` en el chat del agente.

**Qué hace:** Elimina la carpeta `.cursor/`. Deja solo `.agent/` y `.antigravity/` para la configuración del DT.

## Advertencia

**No ejecutes el setup sin intención explícita.** Los comandos eliminan carpetas del proyecto. La IA te pedirá confirmación antes de proceder.

## Cómo restaurar

Si ejecutaste el setup por error o querés volver a tener ambas configuraciones:

- **Restaurar Antigravity** (después de setup-cursor): `git checkout .agent .antigravity`
- **Restaurar Cursor** (después de setup-antigravity): `git checkout .cursor`

## Estructura según IDE

| IDE | Carpetas activas |
|-----|------------------|
| Cursor | `.cursor/` (rules, commands, agents) |
| Antigravity | `.agent/` (rules, skills, workflows) + `.antigravity/` (rules.md) |
