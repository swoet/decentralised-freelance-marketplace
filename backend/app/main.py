from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi_limiter import FastAPILimiter
from fastapi_limiter.depends import RateLimiter
import redis.asyncio as redis
import logging
import asyncio
import os
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from app.api.v1 import api_router
from app.core.config import settings
from app.api.v1.auth import router as auth_router

sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN"),
    integrations=[FastApiIntegration()],
    traces_sample_rate=0.1,
    environment=os.getenv("ENV", "production"),
)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set all CORS enabled origins
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        response.headers['Permissions-Policy'] = 'geolocation=(), microphone=()'
        return response

app.add_middleware(SecurityHeadersMiddleware)

@app.on_event("startup")
async def startup():
    # Log configuration for debugging
    logging.info(f"Database URL: {settings.DATABASE_URL}")
    logging.info(f"CORS Origins: {settings.BACKEND_CORS_ORIGINS}")
    
    try:
        redis_client = redis.from_url(settings.REDIS_HOST)
        await FastAPILimiter.init(redis_client)
        logging.info("Rate limiter initialized successfully")
    except Exception as e:
        logging.error(f"Failed to initialize rate limiter: {e}")

# Include routers without rate limiter for now
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