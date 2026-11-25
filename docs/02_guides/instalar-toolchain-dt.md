---
id: DOC-GUIDE-018
title: Instalar el toolchain de El DT (macOS y Windows)
type: guide
status: canonical
owner: dt-platform
created: 2026-11-25
updated: 2026-11-25
tags:
  - setup
  - toolchain
  - macos
  - windows
domain:
  - meta
summary: Un script instala git, Ruby, GitHub CLI, Node.js y Python en macOS o Windows. Si Homebrew o winget fallan, prueba Command Line Tools, zip o tarball. Atelier y Remotion son opcionales.
related:
  - DOC-GUIDE-006
  - DOC-GUIDE-001
  - DOC-REF-009
keywords:
  - install
  - brew
  - winget
  - ruby
  - node
  - python
  - gh
priority: high
intended_audience:
  - engineers
  - ai-agents
source_of_truth: true
review_cycle_days: 90
---

# Instalar el toolchain de El DT (macOS y Windows)

## Summary

El instalador es el script, no un asistente gráfico. En macOS, `./scripts/dt-install.sh`. En Windows, `scripts/dt-install.ps1`. El perfil base deja git, Ruby, GitHub CLI, Node.js y Python. Si el primer camino falla, prueba el siguiente y sigue con el resto de las herramientas.

## Purpose

Que una máquina vacía pueda operar el DT sin elegir a mano el gestor de paquetes. Atelier (impeccable) y Remotion quedan fuera del perfil base: se piden con un flag.

## Scope

**Cubre:** el perfil base y, si se piden, ffmpeg, `npm ci` de `tools/atelier` y `npm ci` de `tools/remotion`.
**No cubre:** el IDE, cuentas de Google, el login de GitHub (`gh auth login` queda como aviso) ni paquetes de un proyecto consumidor.

## Qué instala cada perfil

| Perfil | Piezas | Para qué está en el DT |
|--------|--------|------------------------|
| base | git, Ruby con YAML, `gh`, Node.js LTS 22, Python 3 | `dt-doctor`, sync, `/guardar`, releases, números |
| `--atelier` / `-Atelier` | `npm ci` en `tools/atelier` | detector impeccable |
| `--video` / `-Video` | ffmpeg y `npm ci` en `tools/remotion` | carriles de video |
| `--full` / `-Full` | atelier y video | las dos filas anteriores |

Ruby no usa gems: los scripts hacen `require "yaml"`. Hyperframes se invoca con `npx` y no se preinstala.

## Caminos si un comando falla

El script no se detiene en el primer fallo. Para cada herramienta prueba en orden y, si ese paso no deja el comando usable, pasa al siguiente. Al final lista lo que sigue faltando. Volver a correr el mismo comando salta lo que ya responde.

| Herramienta | macOS | Windows |
|-------------|-------|---------|
| git | PATH real, Homebrew, Command Line Tools (`xcode-select --install`) | PATH, winget `Git.Git`, PortableGit en `%LOCALAPPDATA%\ElDT` (trae Git Bash) |
| Ruby | Ruby del sistema si carga YAML, Homebrew, tarball Ruby 3.4 | PATH, winget Ruby 3.4, RubyInstaller 3.4 en el perfil del usuario |
| GitHub CLI | PATH, Homebrew, zip de `cli/cli` en `~/.local/el-dt/bin` | PATH, winget, zip oficial |
| Node.js | PATH, Homebrew, tarball LTS 22 de nodejs.org | PATH, winget, zip oficial |
| Python 3 | `python3`, un enlace si solo existe `python` 3, Homebrew, tarball 3.12 | `python3`, shim `py -3`, winget, tarball 3.12 |
| ffmpeg | solo con `--video`: PATH, Homebrew, zip de evermeet.cx | solo con `-Video`: PATH, winget, zip de BtbN/FFmpeg-Builds |

En macOS, sin Homebrew, git entra por las Command Line Tools de Apple. El diálogo es manual: cuando termina, se vuelve a correr el script. Las descargas directas no dependen de brew ni de winget.

Los binarios directos quedan en `~/.local/el-dt` (macOS) o `%LOCALAPPDATA%\ElDT` (Windows). El script agrega esa carpeta al PATH del usuario.

## Prerrequisitos

- macOS: `curl`, que ya viene en el sistema. Red la primera vez. Homebrew, si hace falta instalarlo, puede pedir la contraseña; si esa instalación falla, el script sigue por descarga directa.
- Windows 10/11: PowerShell. `winget` (App Installer) se usa si está; si no está, el script baja los zip y los instaladores.

## Pasos

macOS, desde la raíz del repo:

```bash
./scripts/dt-install.sh
./scripts/dt-install.sh --atelier
./scripts/dt-install.sh --video
./scripts/dt-install.sh --full
./scripts/dt-install.sh --check
```

Windows, en PowerShell, desde la raíz del repo:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\dt-install.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\dt-install.ps1 -Atelier
powershell -ExecutionPolicy Bypass -File .\scripts\dt-install.ps1 -Video
powershell -ExecutionPolicy Bypass -File .\scripts\dt-install.ps1 -Full
powershell -ExecutionPolicy Bypass -File .\scripts\dt-install.ps1 -Check
```

`--check` / `-Check` no descarga ni instala. Sale con código 1 si falta algo de lo pedido.

En macOS el PATH nuevo se anota en `~/.zprofile` (o `~/.bash_profile` si la shell es bash), con la marca `El DT toolchain`. Hace falta una terminal nueva para heredarlo.

En Windows, si el instalador de Python no crea `python3`, el script escribe `python3.cmd` en `%LOCALAPPDATA%\ElDT\bin`. Los scripts `./scripts/*.sh` se corren en Git Bash. El instalador imprime la ruta de `bash.exe` que encontró (Git for Windows o PortableGit).

## Validación

```bash
ruby -ryaml -e 'puts RUBY_VERSION'
gh --version
node --version
python3 --version
./scripts/dt-install.sh --check
```

La sesión de GitHub es aparte, una sola vez: `gh auth login`.

Con `--atelier`, además: `test -x tools/atelier/node_modules/.bin/impeccable`.

## Errores comunes

| Síntoma | Qué hacer |
|---------|-----------|
| El script dice que abrió Command Line Tools | Terminar ese diálogo de Apple y volver a correr el mismo comando |
| Ruby instalado y `ruby -ryaml` falla | Abrir una terminal nueva para tomar el PATH |
| `atelier-detect` pide `npm install` | Correr el instalador con `--atelier` o `-Atelier` |
| `gh auth status` sin sesión | Esperado. `gh auth login` cuando haga falta publicar |
| Quedó una herramienta en FALTA | Volver a correr el script. El mensaje dice qué caminos ya probó |

## Referencias

- Ids de Homebrew y winget: `scripts/dt-toolchain.list` (`profile|id|check|brew|winget`)
- Caminos de respaldo: `scripts/dt-install.sh`, `scripts/dt-install.ps1`

## Related docs

- [Primer setup post-clone](primer-setup-dt.md) (`DOC-GUIDE-006`)
- [Configuración multi-IDE](ide-setup.md) (`DOC-GUIDE-001`)
- [Confianza numérica](../03_reference/numeric-verification-default.md) (`DOC-REF-009`)
