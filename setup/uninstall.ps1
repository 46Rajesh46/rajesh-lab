# uninstall.ps1 — removes rz for the current user.
$dest = Join-Path $env:LOCALAPPDATA 'Programs\rz'
$p = [Environment]::GetEnvironmentVariable('Path','User')
[Environment]::SetEnvironmentVariable('Path', (($p -split ';' | Where-Object { $_ -and $_ -ne $dest }) -join ';'), 'User')
Remove-Item 'HKCU:\Software\Classes\*\shell\rz_pack' -Recurse -ErrorAction SilentlyContinue
Remove-Item (Join-Path ([Environment]::GetFolderPath('Programs')) 'rz File Manager.lnk') -ErrorAction SilentlyContinue
Remove-Item $dest -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "rz uninstalled." -ForegroundColor Green
