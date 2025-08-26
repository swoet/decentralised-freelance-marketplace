from __future__ import annotations
import os
import secrets
import hashlib
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.api.deps import get_current_active_user, get_db
from app.models.integration import ApiKey, ApiKeyUsage

router = APIRouter(prefix="/developers", tags=["developers"]) 


class ApiKeyCreate(BaseModel):
    scopes: list[str] = []


@router.post("/api-keys")
def issue_api_key(payload: ApiKeyCreate, db: Session = Depends(get_db), user=Depends(get_current_active_user)):
    # Generate prefix and secret; store only hash
    prefix = f"dev_{secrets.token_hex(4)}"
    secret = secrets.token_urlsafe(32)
    to_hash = f"{prefix}.{secret}".encode("utf-8")
    digest = hashlib.sha256(to_hash).hexdigest()

    ak = ApiKey(owner_id=user.id, prefix=prefix, hash=digest, scopes=payload.scopes or [])
    db.add(ak)
    db.commit()
    db.refresh(ak)

    # Return secret only once
    return {"prefix": prefix, "secret": secret, "scopes": payload.scopes}


@router.get("/api-keys")
def list_api_keys(db: Session = Depends(get_db), user=Depends(get_current_active_user)):
    rows = db.query(ApiKey).filter(ApiKey.owner_id == user.id).order_by(ApiKey.created_at.desc()).all()
    return {"items": [
        {
            "id": str(r.id),
            "prefix": r.prefix,
            "revoked": bool(r.revoked),
            "scopes": r.scopes or [],
            "last_used_at": r.last_used_at.isoformat() if r.last_used_at else None,
        }
        for r in rows
    ]}


@router.delete("/api-keys/{prefix}")
def revoke_api_key(prefix: str, db: Session = Depends(get_db), user=Depends(get_current_active_user)):
    ak = db.query(ApiKey).filter(ApiKey.owner_id == user.id, ApiKey.prefix == prefix).first()
    if not ak:
        raise HTTPException(status_code=404, detail="API key not found")
    ak.revoked = True
    db.add(ak)
    db.commit()
    return {"ok": True}


@router.get("/api-keys/usage")
def api_key_usage(
    prefix: str | None = None,
    route: str | None = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    user=Depends(get_current_active_user),
):
    q = db.query(ApiKeyUsage, ApiKey).join(ApiKey, ApiKey.id == ApiKeyUsage.key_id)
    q = q.filter(ApiKey.owner_id == user.id)
    if prefix:
        q = q.filter(ApiKey.prefix == prefix)
    if route:
        q = q.filter(ApiKeyUsage.route == route)
    rows = q.order_by(ApiKeyUsage.created_at.desc()).limit(min(limit, 1000)).all()

    items = [
        {
            "prefix": r.ApiKey.prefix if hasattr(r, 'ApiKey') else r[1].prefix,
            "route": (r.ApiKeyUsage.route if hasattr(r, 'ApiKeyUsage') else r[0].route),
            "status_code": (r.ApiKeyUsage.status_code if hasattr(r, 'ApiKeyUsage') else r[0].status_code),
            "latency_ms": (r.ApiKeyUsage.latency_ms if hasattr(r, 'ApiKeyUsage') else r[0].latency_ms),
            "created_at": ((r.ApiKeyUsage.created_at if hasattr(r, 'ApiKeyUsage') else r[0].created_at).isoformat() if (r.ApiKeyUsage.created_at if hasattr(r, 'ApiKeyUsage') else r[0].created_at) else None),
        }
        for r in rows
    ]

    # Aggregates
    base = db.query(ApiKeyUsage, ApiKey).join(ApiKey, ApiKey.id == ApiKeyUsage.key_id).filter(ApiKey.owner_id == user.id)
    if prefix:
        base = base.filter(ApiKey.prefix == prefix)
    agg_by_route = db.query(ApiKeyUsage.route, func.count(1)).join(ApiKey, ApiKey.id == ApiKeyUsage.key_id).filter(ApiKey.owner_id == user.id)
    if prefix:
        agg_by_route = agg_by_route.filter(ApiKey.prefix == prefix)
    agg_by_route = agg_by_route.group_by(ApiKeyUsage.route).order_by(func.count(1).desc()).limit(50).all()

    agg_by_status = db.query(ApiKeyUsage.status_code, func.count(1)).join(ApiKey, ApiKey.id == ApiKeyUsage.key_id).filter(ApiKey.owner_id == user.id)
    if prefix:
        agg_by_status = agg_by_status.filter(ApiKey.prefix == prefix)
    agg_by_status = agg_by_status.group_by(ApiKeyUsage.status_code).order_by(func.count(1).desc()).all()

    return {
        "items": items,
        "aggregates": {
            "by_route": [{"route": r[0], "count": r[1]} for r in agg_by_route],
            "by_status": [{"status_code": r[0], "count": r[1]} for r in agg_by_status],
        }
    }
