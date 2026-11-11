@echo off
cd /d "%~dp0"
where npm >nul 2>nul
if errorlevel 1 (
  echo Install Node.js 22.12 or newer, then reopen this file.
  pause
  exit /b 1
)
call npm run setup
if errorlevel 1 echo See the error above for the next step.
pause
