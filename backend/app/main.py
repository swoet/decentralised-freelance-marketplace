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
from app.core.db import SessionLocal
from app.models.integration import ApiKey, ApiKeyUsage
from app.middleware.rate_limit_middleware import RateLimitMiddleware
from datetime import datetime
import time
import hashlib

# Metrics and tracing
from prometheus_fastapi_instrumentator import Instrumentator
from opentelemetry import trace
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

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
import app.models.activity
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

# CORS Configuration - Allow frontend localhost:3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins in development
    allow_credentials=False,  # Must be False when using wildcard origins
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=[
        "Accept",
        "Accept-Language",
        "Content-Language",
        "Content-Type",
        "Authorization",
        "X-API-Key",
        "X-Requested-With",
        "Cache-Control"
    ],
    expose_headers=["*"],
    max_age=600,  # Cache preflight responses for 10 minutes
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
            response.headers['Permissions-Policy'] = 'geolocation=(self), microphone=()'
        return response

class ApiKeyMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable[[Request], Awaitable[Response]]) -> Response:
        start = time.time()
        response: Response | None = None
        api_key_header = request.headers.get("X-API-Key")
        valid_key = None
        prefix = None
        if api_key_header and "." in api_key_header:
            try:
                prefix, secret = api_key_header.split(".", 1)
                digest = hashlib.sha256(f"{prefix}.{secret}".encode("utf-8")).hexdigest()
                db = SessionLocal()
                ak = db.query(ApiKey).filter(ApiKey.prefix == prefix).first()
                if ak and (not ak.revoked) and ak.hash == digest:
                    valid_key = ak
                    request.state.api_key_prefix = prefix
                db.close()
            except Exception:
                pass
        # Enforce scopes only if a valid API key is present
        if valid_key is not None:
            path = str(request.url.path)
            # Exempt internal and public paths
            exempt = ["/metrics", "/docs", "/redoc", f"{settings.API_V1_STR}/openapi.json"]
            if not any(path.startswith(e) for e in exempt):
                method = request.method.upper()
                # Resource name from path: /api/v1/<resource>/...
                parts = path.split("/")
                resource = parts[3] if len(parts) > 3 else "general"
                needed = None
                if method in ("GET", "HEAD", "OPTIONS"):
                    needed = ["read:*", f"read:{resource}"]
                else:
                    needed = ["write:*", f"write:{resource}"]
                scopes = valid_key.scopes or []
                if not any(s in scopes for s in needed):
                    # Return 403 without invoking downstream
                    from starlette.responses import JSONResponse
                    return JSONResponse({"detail": "Insufficient API key scope"}, status_code=403)
        try:
            response = await call_next(request)
            return response
        finally:
            try:
                duration = int((time.time() - start) * 1000)
                if valid_key and response is not None:
                    db = SessionLocal()
                    usage = ApiKeyUsage(
                        key_id=valid_key.id,
                        route=str(request.url.path),
                        status_code=getattr(response, 'status_code', 0),
                        latency_ms=duration,
                    )
                    db.add(usage)
                    valid_key.last_used_at = datetime.utcnow()
                    db.add(valid_key)
                    db.commit()
                    db.close()
            except Exception:
                pass

# Add API key usage/validation middleware first
app.add_middleware(ApiKeyMiddleware)
# Add RateLimiting middleware
app.add_middleware(RateLimitMiddleware)
# Add SecurityHeadersMiddleware after other middleware to avoid CORS conflicts
app.add_middleware(SecurityHeadersMiddleware)

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)

# Prometheus metrics
Instrumentator().instrument(app).expose(app)

# OpenTelemetry tracing (optional via env OTEL_EXPORTER_OTLP_ENDPOINT)
otlp_endpoint = os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT")
if otlp_endpoint:
    resource = Resource(attributes={"service.name": "freelance-platform-api"})
    provider = TracerProvider(resource=resource)
    processor = BatchSpanProcessor(OTLPSpanExporter(endpoint=otlp_endpoint))
    provider.add_span_processor(processor)
    trace.set_tracer_provider(provider)
    FastAPIInstrumentor.instrument_app(app)


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