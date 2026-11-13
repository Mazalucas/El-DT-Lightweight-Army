---
name: dt-revisar-instalacion
description: "[Trabajo] Freno antes de instalar un plugin, MCP, repo, paquete nuevo o submodule. Veredicto corto y una recomendación. Use when the user or the agent is about to install an external plugin, MCP server, repository, new package, or submodule."
---

# Revisar una instalación externa

La regla `00-orquestador-core` obliga este paso. No es `/hack`. No ejecutes el código que estás por traer para «probarlo».

## Qué entra y qué no

| Entra | No entra |
|-------|----------|
| Plugin o conector del IDE | `npm install` / equivalente de un lockfile que ya está |
| Servidor MCP nuevo | Actualizar una dependencia que el proyecto ya declaró |
| `git clone`, submodule o tool vendido al repo | Leer docs de algo que ya está instalado |
| Paquete que no figura en el lockfile ni en el manifiesto | |

## Paso 0 — atajo oficial

Si lo que se va a conectar es el plugin o conector de **Drive, Gmail o Calendar** que piden `/drive`, `/gmail` o `/calendar`, no abras el cuestionario. Una línea:

> Es el conector oficial que pide el DT. **Instalar.**

Seguí el skill de esa app. No recorras Google Cloud Console.

## Qué mirar (sin instalar)

1. **Qué es y de dónde sale.** Nombre, tipo, URL o marketplace. Quién lo publica.
2. **Qué puede hacer.** Leer archivos, escribir, mandar mensajes, red, credenciales, shell. Si el manifiesto o el README no lo dicen, el veredicto no puede ser **Instalar** a secas: es **Instalar con límite** o **No instalar**.
3. **Si ya lo tenemos.** Buscá en el repo y en `commands-meta.yaml` antes de sumar otro.
4. **Si está fijado.** Tag, commit o versión. `main` suelto de un desconocido empuja a **No instalar**.

No afirmes que «es seguro» si no leíste el origen. Decí qué miraste y qué no.

## Veredicto

Uno solo.

| Veredicto | Cuándo |
|-----------|--------|
| **Instalar** | Origen identificable, permisos acotados a lo que la persona pidió, y no hay equivalente en el DT |
| **Instalar con límite** | Sirve, pero sobra permiso. Nombrá el límite (solo lectura, una carpeta, sin envío) |
| **No instalar** | Origen opaco, permisos de más, o el DT ya hace eso |

Si dudás entre dos, elegí el más prudente.

## Cómo decirlo

Máximo 14 líneas con texto. Una idea por línea.

```markdown
**{Nombre}** — {plugin | MCP | repo | paquete}.
Lo publica {quién}, desde {marketplace o URL}.

Puede: {leer / escribir / enviar / red / credenciales — solo lo que viste}.
No vi: {lo que el README no dice}.

**Recomendación: {Instalar | Instalar con límite | No instalar}.**
{Una frase: por qué, y el límite si aplica.}

👉 {Si es Instalar y ya lo pidió: «Lo instalo en el siguiente paso.» Si no: «¿Lo dejamos así?»}
```

No listes más de un camino alternativo. Si hace falta mirar el código en serio, el 👉 puede ser `/hack` sobre esa copia **después** de tenerla en un lugar que no ejecute sola. No lo ofrezcas en cada revisión.
