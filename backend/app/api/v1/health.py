from fastapi import APIRouter
from sqlalchemy import text

from app.core.db import engine

router = APIRouter(prefix="/health", tags=["health"]) 

@router.get("/liveness")
def liveness():
    return {"status": "ok"}

@router.get("/readiness")
def readiness():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "ready"}
    except Exception as e:
        return {"status": "not_ready", "error": str(e)}