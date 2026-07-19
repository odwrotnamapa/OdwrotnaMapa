@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo Nie znaleziono Node.js.
  echo Zainstaluj Node.js 18 lub nowszy i uruchom plik ponownie.
  echo.
  pause
  exit /b 1
)
node tools\start-local-server.cjs
pause
