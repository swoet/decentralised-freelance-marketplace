@echo off
echo Starting Decentralized Freelance Marketplace Development Environment
echo ================================================================

echo.
echo Starting Backend Server...
start "Backend Server" cmd /k "cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload"

echo Waiting for backend to start...
timeout /t 5 /nobreak > nul

echo.
echo Starting Frontend Server...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo Development servers are starting...
echo Backend: http://localhost:8001
echo Frontend: http://localhost:3000
echo.
echo Press any key to continue...
pause > nul