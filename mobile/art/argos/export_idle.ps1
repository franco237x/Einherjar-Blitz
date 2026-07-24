param(
  [switch]$SkipBackup
)

$ErrorActionPreference = 'Stop'

$sourceDirectory = Split-Path -Parent $PSCommandPath
$mobileRoot = (Resolve-Path -LiteralPath (Join-Path $sourceDirectory '..\..')).Path
$synfig = 'C:\Program Files\Synfig\bin\synfig.exe'
$sourceFile = Join-Path $sourceDirectory 'argos_idle_rig.sif'
$renderDirectory = Join-Path $sourceDirectory '.render'
$gameIdleDirectory = Join-Path $mobileRoot 'assets\images\game\argos\frames\idle'

if (-not (Test-Path -LiteralPath $synfig)) {
  throw "Synfig no está instalado en $synfig"
}

$resolvedSourceFile = (Resolve-Path -LiteralPath $sourceFile).Path
if (-not $resolvedSourceFile.StartsWith($mobileRoot + [IO.Path]::DirectorySeparatorChar)) {
  throw "Archivo fuente fuera del proyecto mobile: $resolvedSourceFile"
}

$resolvedGameIdleDirectory = [IO.Path]::GetFullPath($gameIdleDirectory)
if (-not $resolvedGameIdleDirectory.StartsWith($mobileRoot + [IO.Path]::DirectorySeparatorChar)) {
  throw "Directorio idle fuera del proyecto mobile: $resolvedGameIdleDirectory"
}
if (-not (Test-Path -LiteralPath $resolvedGameIdleDirectory)) {
  New-Item -ItemType Directory -Path $resolvedGameIdleDirectory | Out-Null
}

if (Test-Path -LiteralPath $renderDirectory) {
  $resolvedRenderDirectory = (Resolve-Path -LiteralPath $renderDirectory).Path
  if (-not $resolvedRenderDirectory.StartsWith($sourceDirectory + [IO.Path]::DirectorySeparatorChar)) {
    throw "Directorio de render fuera de art/argos: $resolvedRenderDirectory"
  }
  Remove-Item -LiteralPath $resolvedRenderDirectory -Recurse -Force
}

New-Item -ItemType Directory -Path $renderDirectory | Out-Null

$renderPrefix = Join-Path $renderDirectory 'argos_idle.png'
& $synfig $sourceFile -o $renderPrefix -t png -w 543 -h 724
if ($LASTEXITCODE -ne 0) {
  throw "Synfig terminó con código $LASTEXITCODE"
}

$frameNumbers = @(0, 2, 4, 6, 8, 10)
$existingFrames = @(
  for ($index = 0; $index -lt $frameNumbers.Count; $index++) {
    $candidate = Join-Path $gameIdleDirectory (
      'argos_idle_' + ($index + 1) + '.png'
    )
    if (Test-Path -LiteralPath $candidate) {
      $candidate
    }
  }
)

$backupDirectory = $null
if (-not $SkipBackup -and $existingFrames.Count -gt 0) {
  $backupDirectory = Join-Path $sourceDirectory (
    'backups\idle-' + (Get-Date -Format 'yyyyMMdd-HHmmss')
  )
  New-Item -ItemType Directory -Path $backupDirectory -Force | Out-Null
  foreach ($existingFrame in $existingFrames) {
    Copy-Item -LiteralPath $existingFrame -Destination $backupDirectory
  }
}

for ($index = 0; $index -lt $frameNumbers.Count; $index++) {
  $destination = Join-Path $gameIdleDirectory (
    'argos_idle_' + ($index + 1) + '.png'
  )

  $renderedFrame = Join-Path $renderDirectory (
    'argos_idle.' + $frameNumbers[$index].ToString('0000') + '.png'
  )
  Copy-Item -LiteralPath $renderedFrame -Destination $destination -Force
}

$resolvedRenderDirectory = (Resolve-Path -LiteralPath $renderDirectory).Path
if (-not $resolvedRenderDirectory.StartsWith($sourceDirectory + [IO.Path]::DirectorySeparatorChar)) {
  throw "No se puede limpiar un directorio fuera de art/argos: $resolvedRenderDirectory"
}
Remove-Item -LiteralPath $resolvedRenderDirectory -Recurse -Force

Write-Host 'Idle de Argos exportado correctamente.'
if ($backupDirectory) {
  Write-Host "Backup anterior: $backupDirectory"
}
