# Troubleshooting Guide - Decentralized Freelance Marketplace

## Common Issues and Solutions

### 500 Internal Server Error on Wallet Registration

**Symptoms:**
- POST request to `/api/auth/wallet-register` returns 500 error
- Frontend shows "Profile setup failed" message
- Error occurs at `profile-setup.tsx:47` in `handleSubmit` function

**Root Cause Analysis:**
This error typically occurs when the backend FastAPI server is not running or not accessible.

**Step-by-Step Diagnosis:**

1. **Check Backend Server Status**
   ```bash
   # Check if port 8001 is in use
   netstat -an | findstr :8001
   ```

2. **Test Backend API Directly**
   ```bash
   curl -X POST "http://localhost:8001/api/v1/auth/register" \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"testpass","full_name":"Test User","role":"client"}'
   ```

3. **Check Database Connection**
   ```bash
   cd backend
   python test_registration.py
   ```

**Solutions:**

### Primary Solution: Start Backend Server
```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

### Alternative: Use Development Startup Script
```bash
# Run from project root
start-dev.bat
```

### Configuration Verification
Ensure these environment variables are correctly set:

**Frontend (`frontend/.env.local`):**
```
NEXT_PUBLIC_API_URL=http://localhost:8001/api/v1
```

**Backend (`backend/.env`):**
```
DATABASE_URL=postgresql://freelance_user:Shawn%402202@localhost/freelance_db
SECRET_KEY=Z299W5hwuVnNEJ7qP4ryfdyf2ZYM5orH8mfNkurRfHE
```

## Architecture Flow

```
Frontend (Next.js :3000)
    ↓ POST /api/auth/wallet-register
Next.js API Route
    ↓ POST http://localhost:8001/api/v1/auth/register
FastAPI Backend (:8001)
    ↓ Database operations
PostgreSQL Database
```

## Error Patterns

### Connection Refused
- **Cause**: Backend server not running
- **Solution**: Start backend server on port 8001

### Database Connection Error
- **Cause**: PostgreSQL not running or wrong credentials
- **Solution**: Check database service and credentials

### Schema Validation Error
- **Cause**: Missing required fields in request
- **Solution**: Verify UserCreate schema matches frontend payload

## Prevention

1. **Always start backend before frontend**
2. **Use the provided startup script**
3. **Monitor server logs for early error detection**
4. **Implement health checks in production**

## Development Workflow

1. Start PostgreSQL database
2. Run database migrations if needed
3. Start backend server: `uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload`
4. Start frontend server: `npm run dev`
5. Test wallet registration flow

## Additional Resources

- Backend API Documentation: http://localhost:8001/docs
- Database Schema: Check `backend/app/models/`
- Frontend API Routes: `frontend/pages/api/`