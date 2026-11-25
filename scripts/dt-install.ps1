# dt-install — toolchain de El DT en Windows.
# Idempotente. Si un camino falla, prueba el siguiente y sigue con el resto.
#
# Base (sin flags): git, Ruby, GitHub CLI, Node.js LTS, Python 3.
#   Por herramienta: lo que ya esté en PATH → winget → descarga directa.
#   git sin winget: PortableGit en %LOCALAPPDATA%\ElDT (incluye Git Bash).
# Opcional, no entra en el perfil base:
#   -Atelier   npm ci en tools/atelier (impeccable)
#   -Video     ffmpeg y npm ci en tools/remotion
#   -Full      -Atelier y -Video
#   -Check     no instala; exit 1 si falta algo de lo pedido
#
# Uso:
#   powershell -ExecutionPolicy Bypass -File .\scripts\dt-install.ps1
#   powershell -ExecutionPolicy Bypass -File .\scripts\dt-install.ps1 -Full
#   powershell -ExecutionPolicy Bypass -File .\scripts\dt-install.ps1 -Check

param(
    [switch]$Full,
    [switch]$Atelier,
    [switch]$Video,
    [switch]$Check,
    [switch]$Help
)

if ($Help) {
    Write-Host @"
Uso: powershell -ExecutionPolicy Bypass -File .\scripts\dt-install.ps1 [-Atelier] [-Video] [-Full] [-Check]

Perfil base (siempre):
  git, Ruby, GitHub CLI, Node.js LTS, Python 3
  Cada uno prueba, en orden: comando ya usable, winget, descarga directa.

Opcional (no es el perfil base):
  -Atelier   npm ci en tools/atelier (impeccable)
  -Video     ffmpeg y npm ci en tools/remotion
  -Full      las dos anteriores
  -Check     no descarga ni instala; exit 1 si falta algo pedido

Lo que ya responde no se reinstala. Si un paso falla, el script sigue.
Las descargas directas quedan en %LOCALAPPDATA%\ElDT.
"@
    exit 0
}

if ($Full) {
    $Atelier = $true
    $Video = $true
}

$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"
try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
} catch {
    Write-Host "->  No pude fijar TLS 1.2. Sigo igual."
}

$Missing = $false
$WingetNoted = $false
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$List = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) "dt-toolchain.list"
$HomeDt = Join-Path $env:LOCALAPPDATA "ElDT"
$Bin = Join-Path $HomeDt "bin"
$Cache = Join-Path $HomeDt "cache"
$NodeLtsMajor = "22"
$Cpu = $env:PROCESSOR_ARCHITECTURE

function Write-Ok($Message) { Write-Host "OK  $Message" }
function Write-Note($Message) { Write-Host "->  $Message" }
function Write-Miss($Message) {
    Write-Host "FALTA  $Message"
    $script:Missing = $true
}
function Write-StepFailed($Message) {
    Write-Host "    (fallo: $Message — sigo con el camino siguiente)"
}

function Refresh-SessionPath {
    $machine = [Environment]::GetEnvironmentVariable("Path", "Machine")
    $user = [Environment]::GetEnvironmentVariable("Path", "User")
    if (-not $machine) { $machine = "" }
    if (-not $user) { $user = "" }
    $env:Path = "$machine;$user"
    if ($env:Path -notlike "*${script:Bin}*") {
        $env:Path = "$script:Bin;$env:Path"
    }
}

function Add-UserPath($Dir) {
    if (-not (Test-Path $Dir)) { return }
    $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
    if (-not $userPath) { $userPath = "" }
    if ($userPath -notlike "*${Dir}*") {
        if ($userPath) {
            [Environment]::SetEnvironmentVariable("Path", "$Dir;$userPath", "User")
        } else {
            [Environment]::SetEnvironmentVariable("Path", $Dir, "User")
        }
        Write-Note "PATH de usuario actualizado ($Dir). Una terminal nueva lo hereda."
    }
    Refresh-SessionPath
}

function Test-Command($Name) {
    return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Test-Tool($Name) {
    if (-not (Test-Command $Name)) { return $false }
    & $Name --version 1>$null 2>$null
    return ($LASTEXITCODE -eq 0)
}

function Test-RubyYaml {
    if (-not (Test-Command "ruby")) { return $false }
    & ruby -ryaml -e "abort 'no' unless defined?(YAML)" 1>$null 2>$null
    return ($LASTEXITCODE -eq 0)
}

function Get-ListField($Id, $Index) {
    if (-not (Test-Path $List)) { return $null }
    foreach ($raw in (Get-Content -Path $List -Encoding UTF8)) {
        $line = ($raw -replace "#.*", "").Trim()
        if (-not $line) { continue }
        $parts = $line.Split("|")
        if ($parts.Length -gt $Index -and $parts[1] -eq $Id) {
            return $parts[$Index]
        }
    }
    return $null
}

function Save-Url($Url, $Dest) {
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $Dest) | Out-Null
    Invoke-WebRequest -Uri $Url -OutFile $Dest -UseBasicParsing -Headers @{ "User-Agent" = "ElDT-toolchain" }
}

function Get-GitHubAssets($Repo, [switch]$Latest) {
    $headers = @{
        "User-Agent" = "ElDT-toolchain"
        "Accept"     = "application/vnd.github+json"
    }
    if ($Latest) {
        $uri = "https://api.github.com/repos/$Repo/releases/latest"
    } else {
        $uri = "https://api.github.com/repos/$Repo/releases?per_page=8"
    }
    $data = Invoke-RestMethod -Headers $headers -Uri $uri
    $assets = @()
    if ($Latest) {
        $assets = @($data.assets)
    } else {
        foreach ($rel in @($data)) {
            $assets += @($rel.assets)
        }
    }
    return $assets
}

function Get-GitHubAssetUrl($Repo, $Regex, [switch]$Latest) {
    try {
        $assets = Get-GitHubAssets $Repo -Latest:$Latest
    } catch {
        Write-StepFailed "API de GitHub ($Repo)"
        return $null
    }
    foreach ($asset in $assets) {
        if ($asset.name -match $Regex) {
            return $asset.browser_download_url
        }
    }
    return $null
}

function Try-Winget($Id) {
    if ($Check) { return $false }
    if (-not $Id) { return $false }
    if (-not (Test-Command "winget")) {
        if (-not $script:WingetNoted) {
            Write-Note "winget no esta. Sigo con descargas directas."
            $script:WingetNoted = $true
        }
        return $false
    }
    Write-Note "winget install $Id"
    & winget install --id $Id -e --accept-package-agreements --accept-source-agreements --disable-interactivity
    $code = $LASTEXITCODE
    Refresh-SessionPath
    if ($code -eq 0 -or $code -eq -1978335189) {
        return $true
    }
    Write-StepFailed "winget install $Id (codigo $code)"
    return $false
}

function Ensure-Python3Shim($PythonExe) {
    New-Item -ItemType Directory -Force -Path $Bin | Out-Null
    $shim = Join-Path $Bin "python3.cmd"
    if ($PythonExe) {
        Set-Content -Path $shim -Encoding ASCII -Value "@echo off`r`n`"$PythonExe`" %*`r`n"
    } elseif (Test-Command "py") {
        Set-Content -Path $shim -Encoding ASCII -Value "@echo off`r`npy -3 %*`r`n"
    } else {
        return $false
    }
    Add-UserPath $Bin
    return (Test-Command "python3")
}

function Install-Git {
    if (Test-Tool "git") {
        Write-Ok "git"
        return
    }
    if ($Check) {
        Write-Miss "git (caminos: PATH, winget Git.Git, PortableGit)"
        return
    }
    $id = Get-ListField "git" 4
    Try-Winget $id | Out-Null
    if (Test-Tool "git") {
        Write-Ok "git (winget)"
        return
    }
    $regex = if ($Cpu -eq "ARM64") { "^PortableGit-.+-arm64\.7z\.exe$" } else { "^PortableGit-.+-64-bit\.7z\.exe$" }
    Write-Note "Descarga directa de PortableGit."
    $url = Get-GitHubAssetUrl "git-for-windows/git" $regex -Latest
    if (-not $url) {
        Write-Miss "git (winget fallo y no encontre PortableGit)"
        return
    }
    $sfx = Join-Path $Cache "PortableGit.7z.exe"
    $dest = Join-Path $HomeDt "PortableGit"
    try {
        Save-Url $url $sfx
        New-Item -ItemType Directory -Force -Path $dest | Out-Null
        & $sfx "-o$dest" "-y" | Out-Null
    } catch {
        Write-StepFailed "PortableGit"
        Write-Miss "git"
        return
    }
    $gitCmd = Join-Path $dest "cmd"
    if (Test-Path (Join-Path $gitCmd "git.exe")) {
        Add-UserPath $gitCmd
    }
    $bash = Get-ChildItem -Path $dest -Recurse -Filter "bash.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($bash) {
        Add-UserPath $bash.DirectoryName
        Write-Note "Git Bash: $($bash.FullName)"
    }
    if (Test-Tool "git") {
        Write-Ok "git (PortableGit)"
    } else {
        Write-Miss "git (PortableGit no dejo git.exe en PATH)"
    }
}

function Install-Ruby {
    if (Test-RubyYaml) {
        Write-Ok "ruby"
        return
    }
    if ($Check) {
        Write-Miss "ruby (caminos: PATH con YAML, winget Ruby 3.4, RubyInstaller 3.4 en el perfil del usuario)"
        return
    }
    $id = Get-ListField "ruby" 4
    Try-Winget $id | Out-Null
    Refresh-SessionPath
    if (Test-RubyYaml) {
        Write-Ok "ruby (winget)"
        return
    }
    Write-Note "Descarga directa de RubyInstaller 3.4."
    $url = Get-GitHubAssetUrl "oneclick/rubyinstaller2" "^rubyinstaller-3\.4\.[0-9]+-[0-9]-x64\.exe$"
    if (-not $url) {
        Write-Miss "ruby (winget fallo y no encontre RubyInstaller 3.4)"
        return
    }
    $exe = Join-Path $Cache "rubyinstaller.exe"
    $dest = Join-Path $HomeDt "Ruby34"
    try {
        Save-Url $url $exe
        & $exe /VERYSILENT /SUPPRESSMSGBOXES /NORESTART "/DIR=$dest" | Out-Null
    } catch {
        Write-StepFailed "RubyInstaller"
        Write-Miss "ruby"
        return
    }
    $rubyBin = Join-Path $dest "bin"
    if (Test-Path (Join-Path $rubyBin "ruby.exe")) {
        Add-UserPath $rubyBin
    }
    if (Test-RubyYaml) {
        Write-Ok "ruby (RubyInstaller en $dest)"
    } else {
        Write-Miss "ruby (el instalador termino y ruby -ryaml no responde; abri una terminal nueva y volve a correr el script)"
    }
}

function Install-Gh {
    if (Test-Tool "gh") {
        Write-Ok "gh"
        return
    }
    if ($Check) {
        Write-Miss "gh (caminos: PATH, winget, zip oficial de cli/cli)"
        return
    }
    $id = Get-ListField "gh" 4
    Try-Winget $id | Out-Null
    if (Test-Tool "gh") {
        Write-Ok "gh (winget)"
        return
    }
    $regex = if ($Cpu -eq "ARM64") { "^gh_.+_windows_arm64\.zip$" } else { "^gh_.+_windows_amd64\.zip$" }
    Write-Note "Descarga directa de GitHub CLI."
    $url = Get-GitHubAssetUrl "cli/cli" $regex -Latest
    if (-not $url) {
        Write-Miss "gh"
        return
    }
    $zip = Join-Path $Cache "gh.zip"
    $extract = Join-Path $Cache "gh-extract"
    try {
        Save-Url $url $zip
        if (Test-Path $extract) { Remove-Item -Recurse -Force $extract }
        Expand-Archive -Force -Path $zip -DestinationPath $extract
    } catch {
        Write-StepFailed "zip de gh"
        Write-Miss "gh"
        return
    }
    $exe = Get-ChildItem -Path $extract -Recurse -Filter "gh.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $exe) {
        Write-Miss "gh (el zip no trae gh.exe)"
        return
    }
    New-Item -ItemType Directory -Force -Path $Bin | Out-Null
    Copy-Item -Force $exe.FullName (Join-Path $Bin "gh.exe")
    Add-UserPath $Bin
    if (Test-Tool "gh") { Write-Ok "gh (zip en $Bin)" } else { Write-Miss "gh" }
}

function Install-Node {
    if (Test-Tool "node") {
        Write-Ok "node"
        return
    }
    if ($Check) {
        Write-Miss "node (caminos: PATH, winget, zip LTS $NodeLtsMajor de nodejs.org)"
        return
    }
    $id = Get-ListField "node" 4
    Try-Winget $id | Out-Null
    if (Test-Tool "node") {
        Write-Ok "node (winget)"
        return
    }
    $nodeArch = if ($Cpu -eq "ARM64") { "arm64" } else { "x64" }
    Write-Note "Descarga directa de Node.js LTS $NodeLtsMajor."
    try {
        $sums = (Invoke-WebRequest -UseBasicParsing -Headers @{ "User-Agent" = "ElDT-toolchain" } -Uri "https://nodejs.org/dist/latest-v$NodeLtsMajor.x/SHASUMS256.txt").Content
    } catch {
        Write-StepFailed "indice de nodejs.org"
        Write-Miss "node"
        return
    }
    $name = $null
    foreach ($line in ($sums -split "`n")) {
        if ($line -match "win-$nodeArch\.zip") {
            $bits = $line.Trim() -split "\s+"
            $name = $bits[$bits.Length - 1] -replace "^\./", ""
            break
        }
    }
    if (-not $name) {
        Write-Miss "node (no hay zip win-$nodeArch en el indice LTS)"
        return
    }
    $url = "https://nodejs.org/dist/latest-v$NodeLtsMajor.x/$name"
    $zip = Join-Path $Cache $name
    $dest = Join-Path $HomeDt "node"
    try {
        Save-Url $url $zip
        if (Test-Path $dest) { Remove-Item -Recurse -Force $dest }
        New-Item -ItemType Directory -Force -Path $dest | Out-Null
        Expand-Archive -Force -Path $zip -DestinationPath $dest
    } catch {
        Write-StepFailed "zip de node"
        Write-Miss "node"
        return
    }
    $nodeExe = Get-ChildItem -Path $dest -Recurse -Filter "node.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $nodeExe) {
        Write-Miss "node (el zip no trae node.exe)"
        return
    }
    Add-UserPath $nodeExe.DirectoryName
    if (Test-Tool "node") { Write-Ok "node (zip en $($nodeExe.DirectoryName))" } else { Write-Miss "node" }
}

function Install-Python {
    if (Test-Tool "python3") {
        Write-Ok "python3"
        return
    }
    if ((Test-Command "py") -and -not $Check) {
        if (Ensure-Python3Shim $null) {
            Write-Ok "python3 (shim hacia py -3)"
            return
        }
    }
    if ($Check) {
        Write-Miss "python3 (caminos: PATH, py -3, winget, tarball oficial de Python 3.12)"
        return
    }
    $id = Get-ListField "python" 4
    Try-Winget $id | Out-Null
    Refresh-SessionPath
    if (Test-Tool "python3") {
        Write-Ok "python3 (winget)"
        return
    }
    if ((Test-Command "py") -and (Ensure-Python3Shim $null)) {
        Write-Ok "python3 (shim hacia py -3)"
        return
    }
    $pyArch = if ($Cpu -eq "ARM64") { "aarch64-pc-windows-msvc" } else { "x86_64-pc-windows-msvc" }
    Write-Note "Descarga directa de Python 3.12 ($pyArch)."
    $regex = "^cpython-3\.12\..+\+$pyArch-install_only\.tar\.gz$"
    $url = Get-GitHubAssetUrl "astral-sh/python-build-standalone" $regex -Latest
    if (-not $url) {
        Write-Miss "python3"
        return
    }
    $tar = Join-Path $Cache "python.tar.gz"
    $dest = Join-Path $HomeDt "python-extract"
    try {
        Save-Url $url $tar
        if (Test-Path $dest) { Remove-Item -Recurse -Force $dest }
        New-Item -ItemType Directory -Force -Path $dest | Out-Null
        & tar -xzf $tar -C $dest
        if ($LASTEXITCODE -ne 0) { throw "tar salio con $LASTEXITCODE" }
    } catch {
        Write-StepFailed "tarball de python"
        Write-Miss "python3"
        return
    }
    $exe = Get-ChildItem -Path $dest -Recurse -Filter "python.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $exe) {
        Write-Miss "python3 (el tarball no trae python.exe)"
        return
    }
    if (Ensure-Python3Shim $exe.FullName) {
        Write-Ok "python3 (tarball, $($exe.FullName))"
    } else {
        Write-Miss "python3"
    }
}

function Install-Ffmpeg {
    if (-not $Video) { return }
    if (Test-Tool "ffmpeg") {
        Write-Ok "ffmpeg"
        return
    }
    if ($Check) {
        Write-Miss "ffmpeg (caminos: PATH, winget, zip de BtbN/FFmpeg-Builds)"
        return
    }
    $id = Get-ListField "ffmpeg" 4
    Try-Winget $id | Out-Null
    if (Test-Tool "ffmpeg") {
        Write-Ok "ffmpeg (winget)"
        return
    }
    $regex = if ($Cpu -eq "ARM64") { "^ffmpeg-master-latest-winarm64-gpl\.zip$" } else { "^ffmpeg-master-latest-win64-gpl\.zip$" }
    Write-Note "Descarga directa de ffmpeg."
    $url = Get-GitHubAssetUrl "BtbN/FFmpeg-Builds" $regex -Latest
    if (-not $url) {
        Write-Miss "ffmpeg"
        return
    }
    $zip = Join-Path $Cache "ffmpeg.zip"
    $extract = Join-Path $Cache "ffmpeg-extract"
    try {
        Save-Url $url $zip
        if (Test-Path $extract) { Remove-Item -Recurse -Force $extract }
        Expand-Archive -Force -Path $zip -DestinationPath $extract
    } catch {
        Write-StepFailed "zip de ffmpeg"
        Write-Miss "ffmpeg"
        return
    }
    $exe = Get-ChildItem -Path $extract -Recurse -Filter "ffmpeg.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $exe) {
        Write-Miss "ffmpeg (el zip no trae ffmpeg.exe)"
        return
    }
    New-Item -ItemType Directory -Force -Path $Bin | Out-Null
    Copy-Item -Force $exe.FullName (Join-Path $Bin "ffmpeg.exe")
    Add-UserPath $Bin
    if (Test-Tool "ffmpeg") { Write-Ok "ffmpeg (zip en $Bin)" } else { Write-Miss "ffmpeg" }
}

function Invoke-NpmCi($RelativeDir, $Label, $Sentinel) {
    $sentinelPath = Join-Path $Root ($Sentinel -replace "/", "\")
    if (Test-Path $sentinelPath) {
        Write-Ok $Label
        return
    }
    if (-not (Test-Command "npm")) {
        Write-Miss "$Label (npm no esta; el perfil base no alcanzo a dejar Node)"
        return
    }
    if ($Check) {
        Write-Miss "$Label (npm ci en $RelativeDir)"
        return
    }
    Write-Note "npm ci en $RelativeDir"
    Push-Location (Join-Path $Root ($RelativeDir -replace "/", "\"))
    try {
        & npm ci
        if ($LASTEXITCODE -ne 0) {
            Write-Miss $Label
            return
        }
    } finally {
        Pop-Location
    }
    if (Test-Path $sentinelPath) { Write-Ok $Label } else { Write-Miss $Label }
}

if (-not (Test-Path $List)) {
    Write-Host "dt-install: no esta $List"
    exit 1
}

New-Item -ItemType Directory -Force -Path $Bin, $Cache | Out-Null
Refresh-SessionPath

Install-Git
Install-Ruby
Install-Gh
Install-Node
Install-Python
Install-Ffmpeg

if ($Atelier) {
    Invoke-NpmCi "tools/atelier" "atelier (impeccable)" "tools/atelier/node_modules/.bin/impeccable"
}
if ($Video) {
    $remotionSentinel = "tools/remotion/node_modules/.bin/remotion.cmd"
    if (-not (Test-Path (Join-Path $Root ($remotionSentinel -replace "/", "\")))) {
        $unixSentinel = "tools/remotion/node_modules/.bin/remotion"
        if (Test-Path (Join-Path $Root ($unixSentinel -replace "/", "\"))) {
            $remotionSentinel = $unixSentinel
        }
    }
    Invoke-NpmCi "tools/remotion" "remotion" $remotionSentinel
}

if (Test-Command "gh") {
    & gh auth status 1>$null 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Ok "gh autenticado"
    } else {
        Write-Note "GitHub CLI esta instalado y todavia no tiene sesion. Cuando quieras publicar: gh auth login"
    }
}

$bash = Get-Command bash -ErrorAction SilentlyContinue
Write-Host ""
if ($bash) {
    Write-Host "Git Bash para los scripts del DT: $($bash.Source)"
} else {
    Write-Host "Cuando git quede instalado, los scripts ./scripts/*.sh se corren en Git Bash."
}

if ($Missing) {
    Write-Host "dt-install: quedo algo pendiente. Volve a correr el mismo comando: lo que ya responde no se reinstala."
    exit 1
}

Write-Host "dt-install: listo."
exit 0
