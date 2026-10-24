@echo off
title Create LX-IDE Desktop Shortcut
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$WshShell = New-Object -ComObject WScript.Shell; $Desktop = [Environment]::GetFolderPath('Desktop'); $Shortcut = $WshShell.CreateShortcut(\"$Desktop\LX-IDE.lnk\"); $Shortcut.TargetPath = (Join-Path (Get-Location) 'Start-Desktop-App.bat'); $Shortcut.WorkingDirectory = (Get-Location).Path; $Shortcut.Description = 'LX-IDE Offline LaTeX Studio'; $Shortcut.Save(); Write-Host 'Desktop shortcut created successfully!'"
pause
