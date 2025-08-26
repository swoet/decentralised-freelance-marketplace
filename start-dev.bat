@echo off
echo Starting Decentralized Freelance Marketplace Development Environment
echo ================================================================

REM Set environment variables for AI/ML features
set AI_MATCHING_ENABLED=true
set EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
set SKILLS_VERIFICATION_ENABLED=true
set REPUTATION_V2_ENABLED=true
set MATCHING_CACHE_TTL=3600

REM Set Redis for background jobs and caching
set REDIS_HOST=redis://localhost:6379
set RQ_DASHBOARD_ENABLED=true

REM OAuth configuration
set OAUTH_ENCRYPTION_KEY=your-32-byte-encryption-key-here
set SLACK_CLIENT_ID=your-slack-client-id
set SLACK_CLIENT_SECRET=your-slack-client-secret
set JIRA_CLIENT_ID=your-jira-client-id
set JIRA_CLIENT_SECRET=your-jira-client-secret

echo.
echo Starting Redis Server...
start "Redis Server" cmd /k "redis-server"

echo Waiting for Redis to start...
timeout /t 3 /nobreak > nul

echo.
echo Starting RQ Worker for Background Jobs...
start "RQ Worker" cmd /k "cd backend && python -m rq worker --url redis://localhost:6379"

echo.
echo Starting RQ Dashboard...
start "RQ Dashboard" cmd /k "cd backend && rq-dashboard --redis-url redis://localhost:6379 --port 9181"

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
echo Backend API: http://localhost:8001
echo Frontend: http://localhost:3000
echo RQ Dashboard: http://localhost:9181
echo Redis: localhost:6379
echo.
echo New Features Available:
echo - AI-powered project matching
echo - Skills verification system
echo - Advanced reputation scoring
echo - OAuth integrations (Slack, Jira, Trello)
echo - Background job processing
echo.
echo Press any key to continue...
pause > nul