@echo off
setlocal
cd /d "%~dp0"

echo [Lanobe] Starting local development server...

if not exist node_modules (
  echo [Lanobe] Installing dependencies...
  call npm install
  if errorlevel 1 goto :fail
)

start "" cmd /c "timeout /t 3 >nul && start http://localhost:3000"
call npm run dev
if errorlevel 1 goto :fail

endlocal
exit /b 0

:fail
echo.
echo [Lanobe] Failed to start local development server.
pause
endlocal
exit /b 1
