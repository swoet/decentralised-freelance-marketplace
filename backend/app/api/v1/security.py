from __future__ import annotations
import hashlib
import json
import secrets
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List

from app.api.deps import get_current_active_user, get_db
from app.models.security import Session as UserSession, BackupCode, ConsentLog
from app.models.user import User
from app.services.mfa_service import MFAService
from app.services.rate_limit_service import RateLimitService
from app.services.account_lockout_service import AccountLockoutService

router = APIRouter(prefix="/security", tags=["security"]) 

# MFA Pydantic Models
class MFASetupResponse(BaseModel):
    success: bool
    message: str
    qr_code: Optional[str] = None
    provisioning_uri: Optional[str] = None
    backup_codes: Optional[List[str]] = None
    mfa_id: Optional[str] = None

class MFASetupRequest(BaseModel):
    totp_code: str

class MFAVerifyRequest(BaseModel):
    totp_code: str

class MFAStatusResponse(BaseModel):
    enabled: bool
    mfa_type: Optional[str]
    backup_codes_count: int
    setup_date: Optional[str]

class BackupCodesResponse(BaseModel):
    success: bool
    message: str
    backup_codes: List[str]

# MFA Endpoints
@router.get("/mfa/setup/init", response_model=dict)
def init_mfa_setup(request: Request, db: Session = Depends(get_db), user=Depends(get_current_active_user)):
    """
    Initialize MFA setup by generating TOTP secret and QR code
    """
    mfa_service = MFAService(db)
    
    # Get client IP and user agent for security logging
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get('user-agent')
    
    try:
        secret, provisioning_uri = mfa_service.generate_totp_secret(user)
        qr_code = mfa_service.generate_qr_code(provisioning_uri)
        
        return {
            "success": True,
            "message": "MFA setup initialized",
            "qr_code": qr_code,
            "provisioning_uri": provisioning_uri,
            "secret": secret  # Temporary - for testing. Remove in production
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to initialize MFA setup: {str(e)}")

@router.post("/mfa/setup/complete", response_model=MFASetupResponse)
def complete_mfa_setup(
    setup_request: MFASetupRequest,
    request: Request,
    db: Session = Depends(get_db), 
    user=Depends(get_current_active_user)
):
    """
    Complete MFA setup by verifying TOTP code and enabling MFA
    """
    mfa_service = MFAService(db)
    
    # Get client IP and user agent for security logging
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get('user-agent')
    
    try:
        result = mfa_service.setup_totp_mfa(
            user_id=str(user.id),
            totp_code=setup_request.totp_code,
            ip_address=client_ip,
            user_agent=user_agent
        )
        
        return MFASetupResponse(**result)
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to complete MFA setup: {str(e)}")

@router.post("/mfa/verify", response_model=dict)
def verify_mfa_code(
    verify_request: MFAVerifyRequest,
    request: Request,
    db: Session = Depends(get_db), 
    user=Depends(get_current_active_user)
):
    """
    Verify MFA TOTP code or backup code
    """
    mfa_service = MFAService(db)
    
    # Get client IP and user agent for security logging
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get('user-agent')
    
    try:
        result = mfa_service.verify_totp_code(
            user_id=str(user.id),
            totp_code=verify_request.totp_code,
            ip_address=client_ip,
            user_agent=user_agent
        )
        
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to verify MFA code: {str(e)}")

@router.delete("/mfa", response_model=dict)
def disable_mfa(
    verify_request: MFAVerifyRequest,
    request: Request,
    db: Session = Depends(get_db), 
    user=Depends(get_current_active_user)
):
    """
    Disable MFA after verifying current TOTP code
    """
    mfa_service = MFAService(db)
    
    # Get client IP and user agent for security logging
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get('user-agent')
    
    try:
        result = mfa_service.disable_totp_mfa(
            user_id=str(user.id),
            verification_code=verify_request.totp_code,
            ip_address=client_ip,
            user_agent=user_agent
        )
        
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to disable MFA: {str(e)}")

@router.get("/mfa/status", response_model=MFAStatusResponse)
def get_mfa_status(db: Session = Depends(get_db), user=Depends(get_current_active_user)):
    """
    Get current MFA status for the user
    """
    mfa_service = MFAService(db)
    
    try:
        status = mfa_service.get_mfa_status(str(user.id))
        return MFAStatusResponse(**status)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get MFA status: {str(e)}")

@router.post("/mfa/backup-codes/regenerate", response_model=BackupCodesResponse)
def regenerate_backup_codes(
    verify_request: MFAVerifyRequest,
    request: Request,
    db: Session = Depends(get_db), 
    user=Depends(get_current_active_user)
):
    """
    Regenerate backup codes after verifying TOTP code
    """
    mfa_service = MFAService(db)
    
    # Get client IP and user agent for security logging
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get('user-agent')
    
    try:
        result = mfa_service.regenerate_backup_codes(
            user_id=str(user.id),
            verification_code=verify_request.totp_code,
            ip_address=client_ip,
            user_agent=user_agent
        )
        
        return BackupCodesResponse(**result)
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to regenerate backup codes: {str(e)}")

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

# Rate Limiting Management Endpoints
@router.get("/rate-limits/status")
def get_rate_limit_status(
    identifier: str,
    rule_name: str = "api_general",
    db: Session = Depends(get_db),
    user=Depends(get_current_active_user)
):
    """Get rate limit status for an identifier"""
    rate_limit_service = RateLimitService(db)
    status = rate_limit_service.get_rate_limit_status(rule_name, identifier)
    return status

@router.get("/rate-limits/violations")
def get_rate_limit_violations(
    hours_back: int = 24,
    limit: int = 100,
    db: Session = Depends(get_db),
    user=Depends(get_current_active_user)
):
    """Get rate limit violations summary"""
    rate_limit_service = RateLimitService(db)
    violations = rate_limit_service.get_violations_summary(hours_back, limit)
    return violations

@router.post("/rate-limits/reset")
def reset_rate_limit(
    payload: dict,
    request: Request,
    db: Session = Depends(get_db),
    user=Depends(get_current_active_user)
):
    """Reset rate limits for an identifier (admin only)"""
    if user.role != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    rule_name = payload.get('rule_name', 'api_general')
    identifier = payload.get('identifier')
    reason = payload.get('reason', 'admin_reset')
    
    if not identifier:
        raise HTTPException(status_code=400, detail="Identifier is required")
    
    rate_limit_service = RateLimitService(db)
    success = rate_limit_service.reset_rate_limit(
        rule_name=rule_name,
        identifier=identifier,
        admin_user_id=str(user.id),
        reason=reason
    )
    
    if success:
        return {"ok": True, "message": "Rate limits reset successfully"}
    else:
        raise HTTPException(status_code=500, detail="Failed to reset rate limits")

# Security Statistics Endpoints
@router.get("/security-events/statistics")
def get_security_statistics(
    days_back: int = 7,
    db: Session = Depends(get_db),
    user=Depends(get_current_active_user)
):
    """Get security event statistics (admin only)"""
    if user.role != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    from app.services.security_event_service import SecurityEventService
    security_service = SecurityEventService(db)
    stats = security_service.get_event_statistics(days_back)
    return stats

# Account Lockout Management Endpoints
@router.get("/account-lockouts")
def get_locked_accounts(
    limit: int = 100,
    include_expired: bool = False,
    db: Session = Depends(get_db),
    user=Depends(get_current_active_user)
):
    """Get list of locked accounts (admin only)"""
    if user.role != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    lockout_service = AccountLockoutService(db)
    locked_accounts = lockout_service.get_locked_accounts(limit, include_expired)
    return locked_accounts

@router.post("/account-lockouts/unlock")
def unlock_account(
    payload: dict,
    request: Request,
    db: Session = Depends(get_db),
    user=Depends(get_current_active_user)
):
    """Unlock a locked account (admin only)"""
    if user.role != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    user_id = payload.get('user_id')
    reason = payload.get('reason', 'admin_unlock')
    
    if not user_id:
        raise HTTPException(status_code=400, detail="User ID is required")
    
    lockout_service = AccountLockoutService(db)
    success = lockout_service.admin_unlock_account(
        user_id=user_id,
        admin_user_id=str(user.id),
        reason=reason,
        ip_address=request.client.host if request.client else None
    )
    
    if success:
        return {"ok": True, "message": "Account unlocked successfully"}
    else:
        return {"ok": False, "message": "No locked accounts found for user"}

@router.get("/account-lockouts/statistics")
def get_lockout_statistics(
    days_back: int = 7,
    db: Session = Depends(get_db),
    user=Depends(get_current_active_user)
):
    """Get account lockout statistics (admin only)"""
    if user.role != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    lockout_service = AccountLockoutService(db)
    stats = lockout_service.get_lockout_statistics(days_back)
    return stats

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
