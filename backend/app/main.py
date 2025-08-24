from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi_limiter import FastAPILimiter
import redis.asyncio as redis
from redis.asyncio import Redis
import logging
import os
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from typing import Callable, Awaitable
from contextlib import asynccontextmanager
from sqlalchemy import text

from app.api.v1 import api_router
from app.core.config import settings
from app.core.db import engine

# Initialize Sentry
sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN"),
    integrations=[FastApiIntegration()],
    traces_sample_rate=0.1,
    environment=os.getenv("ENV", "production"),
)

# Import all models to ensure they're registered with SQLAlchemy
import app.models.user
import app.models.project
import app.models.bid
import app.models.message
import app.models.milestone
import app.models.organization
import app.models.portfolio
import app.models.review
import app.models.base

# Initialize database tables at startup
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup
    try:
        # Create schema and initialize database
        with engine.connect() as conn:
            conn.execute(text("CREATE SCHEMA IF NOT EXISTS marketplace"))
            conn.commit()
            logging.info("Database schema created/verified successfully")
        
        # Initialize rate limiter if Redis is configured
        if settings.REDIS_HOST:
            try:
                redis_client: Redis = await redis.from_url(settings.REDIS_HOST)
                await FastAPILimiter.init(redis_client)
                logging.info("Rate limiter initialized successfully")
            except Exception as e:
                logging.warning(f"Rate limiter initialization failed: {e}")
        else:
            logging.warning("REDIS_HOST not configured, rate limiting disabled")
            
    except Exception as e:
        logging.error(f"Startup error: {str(e)}")
        raise
    
    yield  # yield control back to FastAPI
    
    # Cleanup if needed
    logging.info("Shutting down application")

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# CORS Configuration - Use FastAPI's native CORSMiddleware properly
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=False,  # Must be False when using allow_origins=["*"]
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Debug logging for CORS configuration
logging.info("CORS middleware configured to allow all origins for development")

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable[[Request], Awaitable[Response]]) -> Response:
        response = await call_next(request)
        # Only add security headers if not a CORS preflight request
        if request.method != "OPTIONS":
            response.headers['X-Frame-Options'] = 'DENY'
            response.headers['X-Content-Type-Options'] = 'nosniff'
            response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
            response.headers['Permissions-Policy'] = 'geolocation=(), microphone=()'
        return response

# Add SecurityHeadersMiddleware BEFORE CORSMiddleware to avoid conflicts
app.add_middleware(SecurityHeadersMiddleware)

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
def read_root():
    return {"message": "Welcome to the Decentralized Freelance Marketplace API"}

@app.get("/test")
def test_endpoint():
    return {"message": "Test endpoint working", "status": "ok"}

@app.get("/projects-test")
def projects_test():
    return {"message": "Projects test endpoint working", "status": "ok"}

# Placeholder for websocket manager
# from app.core.ws import ws_manager
# @app.websocket("/ws/{client_id}")
# async def websocket_endpoint(websocket: WebSocket, client_id: int):
#     await ws_manager.connect(websocket)
#     try:
#         while True:
#             data = await websocket.receive_text()
#             await ws_manager.send_personal_message(f"You wrote: {data}", websocket)
#             await ws_manager.broadcast(f"Client #{client_id} says: {data}")
#     except WebSocketDisconnect:
#         ws_manager.disconnect(websocket)
#         await ws_manager.broadcast(f"Client #{client_id} left the chat") 