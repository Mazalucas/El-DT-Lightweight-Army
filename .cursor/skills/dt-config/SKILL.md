---
name: dt-config
description: "[Rutina] Elegir qué reglas del DT van en cada mensaje, con un panel de perfiles e interruptores. Use when the user invokes /dt-config or wants to tune how much DT context stays active."
---

# dt-config

El usuario elige cuánto contexto de reglas queda activo en esta máquina. El perfil **no lleva nombre** y **no va a Git**.

**No exige `/yo`.** No leas ni escribas `session.yaml`, `roster.yaml` ni `collaboration.yaml`.

## Archivos

| Archivo | Git | Rol |
|---------|-----|-----|
| `vitals/ops/context-profile.yaml` | No | Elección (preset + reglas en siempre) |
| `.cursor/rules/99-perfil-local.mdc` | No | Cuerpos que Cursor carga en cada mensaje |
| `.claude/rules/99-perfil-local.md` | No | El mismo perfil en Claude |
| `.agents/rules/99-perfil-local.md` | No | El mismo perfil en Antigravity |

Las cuatro fijas (personalidad, protocolos, especialistas, equipo) no se apagan. El perfil solo **suma** reglas.

## Si todavía no eligió

1. No preguntes nada fuera del panel.
2. En **Cursor**, corré `ruby scripts/dt-context-profile.rb panel` y publicá esa stdout como visualización inline (fragmento HTML, sin envolverlo en `<html>`). El usuario toca los botones y los interruptores. La frase en negrita es la respuesta.
3. Si no hay visualización, corré `ruby scripts/dt-context-profile.rb text` y mostrá esa salida.
4. Parar. La configuración ocurre cuando responde.

## Cuando responde

Pasá su frase tal cual:

```bash
ruby scripts/dt-context-profile.rb apply --phrase "LA FRASE"
```

Frases válidas: `Recomendado`, `Docs`, `Código`, `Web`, `Números`, o `Recomendado, y Documentación en siempre` (varias unidas con coma y una «y» antes de la última). También valen los rótulos de los botones (`Trabajar en docs`, etc.).

- Exit 0: mostrale el resumen del script, en criollo. El perfil ya quedó escrito.
- Exit 2: decile la frase que no entró y volvé a mostrar el panel.

No edites el YAML ni los `.mdc` a mano. No los commitees.

## Qué ve el usuario

- **No se apaga** — personalidad, protocolos, especialistas, equipo.
- **Usar recomendado** — el resto entra solo cuando el tema aparece.
- **Trabajar en docs / código / web / números** — esas reglas pasan a cada mensaje.
- Un interruptor arma la frase `Recomendado, y … en siempre`.

Las reglas nuevas entran en el **próximo** mensaje. Si no aparecen, un chat nuevo las toma.
