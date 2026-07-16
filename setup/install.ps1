# install.ps1 — installs rz for the current user (no admin needed).
$ErrorActionPreference = 'Stop'
$src  = Join-Path $PSScriptRoot 'rz.exe'
$dest = Join-Path $env:LOCALAPPDATA 'Programs\rz'
if (-not (Test-Path $src)) { Write-Host "rz.exe not found next to this installer." -ForegroundColor Red; exit 1 }

Write-Host "Installing rz -> $dest"
New-Item -ItemType Directory -Force -Path $dest | Out-Null
Copy-Item $src (Join-Path $dest 'rz.exe') -Force

# add to the user's PATH (once)
$p = [Environment]::GetEnvironmentVariable('Path','User')
if ($p -notlike "*$dest*") { [Environment]::SetEnvironmentVariable('Path', ($p.TrimEnd(';') + ';' + $dest), 'User'); Write-Host "Added to PATH." }

# Start Menu shortcut -> opens the GUI
$exe = Join-Path $dest 'rz.exe'
$lnk = Join-Path ([Environment]::GetFolderPath('Programs')) 'rz File Manager.lnk'
$sc = (New-Object -ComObject WScript.Shell).CreateShortcut($lnk)
$sc.TargetPath = $exe; $sc.Arguments = 'ui'; $sc.Save()

# right-click "Compress with rz" on any file (HKCU, no admin).
# Use reg.exe — PowerShell's registry provider treats the '*' key as a wildcard.
reg add 'HKCU\Software\Classes\*\shell\rz_pack' /ve /d 'Compress with rz' /f | Out-Null
reg add 'HKCU\Software\Classes\*\shell\rz_pack\command' /ve /d ('"' + $exe + '" pack "%1"') /f | Out-Null

Write-Host ""
Write-Host "Installed." -ForegroundColor Green
Write-Host "  * Open a NEW terminal and run:  rz ui"
Write-Host "  * Or use the Start Menu item:   rz File Manager"
Write-Host "  * Or right-click any file:       Compress with rz"
