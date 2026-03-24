@echo off
setlocal
cd /d "%~dp0"

echo [Lanobe] Running validation before manual Azure deploy...

if not exist node_modules (
  echo [Lanobe] Installing dependencies...
  call npm install
  if errorlevel 1 goto :fail
)

call npm run test:local
if errorlevel 1 goto :fail

echo [Lanobe] Creating deployment archive...
git archive --format=zip --output deploy-manual.zip HEAD
if errorlevel 1 goto :fail

echo [Lanobe] Deploying to Azure Web App...
call az webapp deploy --resource-group rg-lanobe-japaneast --name lanobe-jpe-764788 --src-path deploy-manual.zip --type zip --restart true --track-status true
if errorlevel 1 goto :fail

echo.
echo [Lanobe] Manual Azure deployment completed.
pause
endlocal
exit /b 0

:fail
echo.
echo [Lanobe] Manual Azure deployment failed.
pause
endlocal
exit /b 1
