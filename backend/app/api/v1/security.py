from __future__ import annotations
import hashlib
import json
import secrets
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, get_db
from app.models.security import Session as UserSession, BackupCode, ConsentLog
from app.models.user import User

router = APIRouter(prefix="/security", tags=["security"]) 

# Sessions
@router.get("/sessions")
def list_sessions(db: Session = Depends(get_db), user=Depends(get_current_active_user)):
    rows = db.query(UserSession).filter(UserSession.user_id == user.id).order_by(UserSession.last_seen_at.desc()).all()
    return {"items": [
        {
            "id": str(r.id),
            "device": r.device,
            "ip": r.ip,
            "ua": r.ua,
            "last_seen_at": r.last_seen_at.isoformat() if r.last_seen_at else None,
            "revoked": r.revoked,
        }
        for r in rows
    ]}

@router.delete("/sessions/{session_id}")
def revoke_session(session_id: str, db: Session = Depends(get_db), user=Depends(get_current_active_user)):
    s = db.query(UserSession).filter(UserSession.id == session_id, UserSession.user_id == user.id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
    s.revoked = True
    db.add(s)
    db.commit()
    return {"ok": True}

# Backup codes
@router.post("/backup-codes")
def generate_backup_codes(db: Session = Depends(get_db), user=Depends(get_current_active_user)):
    # generate 10 random codes; store sha256 hash
    codes = [secrets.token_hex(4) for _ in range(10)]
    for c in codes:
        h = hashlib.sha256(c.encode('utf-8')).hexdigest()
        bc = BackupCode(user_id=user.id, code_hash=h)
        db.add(bc)
    db.commit()
    return {"codes": codes}  # show only once

@router.get("/backup-codes")
def list_backup_codes(db: Session = Depends(get_db), user=Depends(get_current_active_user)):
    rows = db.query(BackupCode).filter(BackupCode.user_id == user.id).all()
    used = sum(1 for r in rows if r.used_at)
    return {"issued": len(rows), "used": used, "remaining": len(rows) - used}

# Consent logging
@router.post("/consent")
def log_consent(payload: dict, request: Request, db: Session = Depends(get_db), user=Depends(get_current_active_user)):
    doc = payload.get('doc')
    version = payload.get('version')
    if not doc or not version:
        raise HTTPException(status_code=400, detail="doc and version required")
    cl = ConsentLog(user_id=user.id, doc=doc, version=version, ip=request.client.host if request.client else None, ua=request.headers.get('user-agent'))
    db.add(cl)
    db.commit()
    return {"ok": True}

# GDPR - data export and delete
@router.post("/gdpr/export")
def export_data(db: Session = Depends(get_db), user=Depends(get_current_active_user)):
    # Simple export: User + consents + sessions metadata
    u = db.query(User).filter(User.id == user.id).first()
    consents = db.query(ConsentLog).filter(ConsentLog.user_id == user.id).all()
    sessions = db.query(UserSession).filter(UserSession.user_id == user.id).all()
    payload = {
        "user": {
            "id": str(u.id),
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        },
        "consents": [
            {"doc": c.doc, "version": c.version, "consented_at": c.consented_at.isoformat() if c.consented_at else None}
            for c in consents
        ],
        "sessions": [
            {
                "device": s.device, "ip": s.ip, "ua": s.ua, "last_seen_at": s.last_seen_at.isoformat() if s.last_seen_at else None, "revoked": s.revoked
            }
            for s in sessions
        ],
    }
    return {"data": payload}

@router.post("/gdpr/delete")
def delete_data(db: Session = Depends(get_db), user=Depends(get_current_active_user)):
    # Soft-delete sensitive fields and flag user as inactive
    u = db.query(User).filter(User.id == user.id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    u.full_name = None
    u.email = f"deleted_{str(u.id)}@example.com"
    u.is_active = False
    db.add(u)
    db.commit()
    return {"ok": True}
