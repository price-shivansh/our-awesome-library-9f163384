@echo off
REM ============================================================
REM  Global Market Dashboard — Local Development Starter
REM  Backend: http://localhost:8001
REM  Frontend: http://localhost:3000
REM ============================================================

echo.
echo  Checking for port conflicts on 8001...
netstat -ano | findstr ":8001" >nul 2>&1
if %errorlevel% == 0 (
    echo  [WARN] Port 8001 is already in use. Backend may already be running.
    echo         If you see API errors, kill the process and re-run this script.
) else (
    echo  Port 8001 is free. Good.
)

echo.
echo  Starting Backend on port 8001...
echo  Logs: backend\backend.log
echo.
start "Global Market Backend" cmd /k "cd /d "%~dp0backend" && python -m uvicorn main:app --host 127.0.0.1 --port 8001 --reload"

echo  Waiting 4 seconds for backend to initialize...
timeout /t 4 /nobreak >nul

echo.
echo  Starting Frontend on port 3000...
echo  Vite proxy: /api/* -> http://localhost:8001
echo.
start "Global Market Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ============================================================
echo   Backend API:  http://localhost:8001
echo   Frontend UI:  http://localhost:3000
echo   Health Check: http://localhost:8001/health
echo   API Docs:     http://localhost:8001/docs
echo ============================================================
echo.
