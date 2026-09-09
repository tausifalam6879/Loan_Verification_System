@echo off
setlocal
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\Start-FinTrack-Instant-Demo.ps1"
if errorlevel 1 (
  echo.
  echo FinTrack could not start. Read the message above.
  pause
)
endlocal
