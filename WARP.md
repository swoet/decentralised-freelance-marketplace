# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

### Quick Start
```bash
# Start all services with Docker Compose (recommended)
docker-compose up -d

# Or use the Windows batch script for local development
.\start-dev.bat
```

### Backend Development
```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Start development server
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload

# Run database migrations
alembic upgrade head

# Create new migration
alembic revision --autogenerate -m "description"

# Test database connection
python check_db.py

# Initialize database schema
python create_schema.py

# Run background worker
python -m rq worker --url redis://localhost:6379

# Start RQ dashboard for job monitoring
rq-dashboard --redis-url redis://localhost:6379 --port 9181
```

### Frontend Development
```bash
cd frontend

# Install dependencies
npm install

# Start development server (runs on port 3001)
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Lint code
npm run lint
```

### Smart Contracts Development
```bash
cd contracts

# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Start local Hardhat node
npx hardhat node

# Run tests
npx hardhat test

# Deploy to localhost
npm run deploy:localhost
```

### Testing
```bash
# Backend tests
cd backend && pytest

# Frontend tests (if configured)
cd frontend && npm test

# Contract tests
cd contracts && npx hardhat test
```

## Architecture Overview

This is a full-stack decentralized freelance marketplace with the following key components:

### Backend (FastAPI + Python)
- **Location**: `backend/app/`
- **Port**: 8001 (development)
- **API Documentation**: http://localhost:8001/docs (Swagger UI)

**Key modules**:
- `app/api/v1/` - REST API endpoints organized by domain
- `app/models/` - SQLAlchemy ORM models with marketplace schema
- `app/core/` - Configuration, database, and security utilities
- `app/services/` - Business logic services
- `app/worker/` - Background job processing with RQ

**Critical API Endpoints**:
- Authentication: `/api/v1/auth/`
- Projects: `/api/v1/projects/`
- Bidding: `/api/v1/bids/`
- Escrow: `/api/v1/escrow/`
- Messaging: `/api/v1/messages/`
- Web3 integration: `/api/v1/web3/`
- AI matching: `/api/v1/matching/` and `/api/v1/matching/v2/`

### Frontend (Next.js + React + TypeScript)
- **Location**: `frontend/`
- **Port**: 3001 (development, not standard 3000)
- **Framework**: Next.js 13 with TypeScript, Tailwind CSS, Headless UI

**Key directories**:
- `pages/` - Next.js pages with file-based routing
- `components/` - Reusable React components
- `hooks/` - Custom React hooks
- `context/` - React context providers
- `utils/` - Utility functions
- `types/` - TypeScript type definitions

### Smart Contracts (Hardhat + Solidity)
- **Location**: `contracts/`
- **Port**: 8545 (local Hardhat node)
- **Framework**: Hardhat with OpenZeppelin contracts

### Infrastructure
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Cache/Jobs**: Redis for caching and RQ background jobs
- **Blockchain**: Ethereum (local Hardhat node for development)
- **Payments**: Stripe for fiat, Web3 for crypto
- **File Storage**: IPFS integration

## Key Technical Features

### AI/ML Integration
The platform includes AI-powered features:
- **Project Matching**: Uses sentence-transformers for semantic matching
- **Skills Verification**: Automated skill assessment
- **Reputation Scoring**: Advanced reputation algorithm (v2)
- Models stored in `app/models/matching.py`

### Background Job Processing
- Uses RQ (Redis Queue) for background tasks
- Worker processes handle async operations (emails, blockchain transactions)
- RQ Dashboard available at http://localhost:9181

### OAuth Integrations
Supports OAuth with multiple providers:
- Slack, Jira, Trello integrations
- OAuth tokens securely encrypted
- Configuration in `app/core/config.py`

### Security Features
- JWT authentication with refresh tokens
- API key management system
- Session tracking with device fingerprinting
- Rate limiting with FastAPI-Limiter
- CORS properly configured for development

### WebSocket Support
- Real-time messaging via WebSocket
- Connection handling in `app/api/v1/ws.py`

## Database Architecture

The system uses PostgreSQL with a `marketplace` schema. Key models:
- `User` - User accounts with role-based access
- `Project` - Project listings and specifications
- `Bid` - Freelancer bids on projects
- `EscrowContract` - Smart contract escrow management
- `Message` - Real-time messaging system
- `Milestone` - Project milestone tracking
- `Organization` - Company/team management

Database migrations managed by Alembic. Always create migrations for schema changes.

## Environment Configuration

### Required Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `SECRET_KEY` - JWT signing secret
- `REDIS_HOST` - Redis connection URL
- `WEB3_PROVIDER_URI` - Ethereum node URI (default: http://localhost:8545)

### Development Setup
1. Copy `.env.example` to `.env` in both `backend/` and `frontend/`
2. Update database and Redis connections
3. Configure OAuth credentials if needed
4. Set AI/ML feature flags in environment

## Common Development Patterns

### Adding New API Endpoints
1. Create router in `backend/app/api/v1/`
2. Define Pydantic schemas in `backend/app/schemas/`
3. Add business logic in `backend/app/services/`
4. Include router in `backend/app/api/v1/__init__.py`

### Database Changes
1. Modify models in `backend/app/models/`
2. Generate migration: `alembic revision --autogenerate -m "description"`
3. Review and edit migration file if needed
4. Apply: `alembic upgrade head`

### Frontend API Integration
- Use custom hooks in `frontend/hooks/` for API calls
- Type all API responses with TypeScript interfaces
- Handle loading/error states consistently

### Smart Contract Development
- Write contracts in `contracts/contracts/`
- Create deployment scripts in `contracts/scripts/`
- Update contract addresses and ABIs in backend configuration

## Troubleshooting

### Backend Issues
- Check logs: `uvicorn.log` in backend directory
- Verify database connection: `python check_db.py`
- Check Redis connection for background jobs
- Ensure all environment variables are set

### Frontend Issues
- Verify API URL matches backend port (8001, not 8000)
- Check CORS configuration in backend
- Ensure WebSocket connections are properly handled

### Database Issues
- Run `python check_schema.py` to verify schema setup
- Use `python init_db.py` to reinitialize if needed
- Check migration status: `alembic current`

### Smart Contract Issues
- Ensure Hardhat node is running on port 8545
- Verify contract compilation: `npx hardhat compile`
- Check deployment scripts for correct network configuration
