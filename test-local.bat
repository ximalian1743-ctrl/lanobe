@echo off
setlocal
cd /d "%~dp0"

echo [Lanobe] Running local verification...

if not exist node_modules (
  echo [Lanobe] Installing dependencies...
  call npm install
  if errorlevel 1 goto :fail
)

call npm run test:local
if errorlevel 1 goto :fail

echo.
echo [Lanobe] Local verification passed.
pause
endlocal
exit /b 0

:fail
echo.
echo [Lanobe] Local verification failed.
pause
endlocal
exit /b 1
