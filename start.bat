@echo off
setlocal
set PROJECT_NAME=School ERP System
title %PROJECT_NAME% - Startup

echo ============================================================
echo   %PROJECT_NAME% - Starting Up...
echo ============================================================

:: 1. Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    pause
    exit /b 1
)

:: 2. Check node_modules
if not exist "node_modules\" (
    echo [INFO] node_modules not found. Running npm install...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] npm install failed.
        pause
        exit /b 1
    )
)

:: 3. Setup Database (Prisma)
echo [INFO] Generating Prisma Client...
call npx prisma generate
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Prisma generate failed.
    pause
    exit /b 1
)

echo [INFO] Synchronizing Database Schema...
call npx prisma db push --accept-data-loss
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Prisma db push failed.
    pause
    exit /b 1
)

:: 4. Open Browser in the background
echo [INFO] Launching browser at http://localhost:3000...
start "" "http://localhost:3000"

:: 5. Start Dev Server
echo [INFO] Starting Next.js Dev Server...
echo ------------------------------------------------------------
call npm run dev

if %ERRORLEVEL% neq 0 (
    echo [ERROR] Dev server crashed.
    pause
)

endlocal
