@echo off
setlocal

cd /d "%~dp0"

echo Starting Shiv Western Club BillDesk...

if not exist "node_modules" (
  echo Installing dependencies. This can take a few minutes...
  call npm.cmd install
  if errorlevel 1 (
    echo.
    echo Dependency install failed.
    pause
    exit /b 1
  )
)

echo Opening http://localhost:3000 ...
start "" "http://localhost:3000"

call npm.cmd run dev

echo.
echo App stopped.
pause
