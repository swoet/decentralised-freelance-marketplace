"""Session management endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from app.api import deps
from app.services.session_service import SessionService
from app.core.config import settings

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.get("/")
def get_user_sessions(
    include_revoked: bool = False,
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_user)
):
    """Get all sessions for the current user."""
    session_service = SessionService(db)
    sessions = session_service.get_user_sessions(
        str(current_user.id), 
        include_revoked=include_revoked
    )
    
    return {
        "sessions": sessions,
        "total_sessions": len(sessions)
    }


@router.delete("/{session_id}")
def revoke_session(
    session_id: UUID,
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_user)
):
    """Revoke a specific session."""
    session_service = SessionService(db)
    
    success = session_service.revoke_session(
        str(session_id), 
        str(current_user.id),
        reason="manual_revoke"
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    return {"message": "Session revoked successfully"}


@router.delete("/")
def revoke_all_sessions(
    except_current: bool = True,
    request: Request = None,
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_user)
):
    """Revoke all sessions for the current user."""
    session_service = SessionService(db)
    
    # Get current session ID if we need to preserve it
    current_session_id = None
    if except_current and hasattr(request.state, 'session_id'):
        current_session_id = request.state.session_id
    
    revoked_count = session_service.revoke_all_sessions(
        str(current_user.id),
        except_session_id=current_session_id,
        reason="revoke_all_sessions"
    )
    
    return {
        "message": f"Successfully revoked {revoked_count} sessions",
        "revoked_count": revoked_count
    }


@router.get("/devices")
def get_user_devices(
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_user)
):
    """Get all devices for the current user."""
    session_service = SessionService(db)
    devices = session_service.get_user_devices(str(current_user.id))
    
    return {
        "devices": devices,
        "total_devices": len(devices)
    }


@router.patch("/devices/{device_id}/trust")
def trust_device(
    device_id: UUID,
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_user)
):
    """Mark a device as trusted."""
    session_service = SessionService(db)
    
    success = session_service.trust_device(
        str(current_user.id),
        str(device_id)
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found"
        )
    
    return {"message": "Device marked as trusted"}


@router.patch("/devices/{device_id}/block")
def block_device(
    device_id: UUID,
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_user)
):
    """Block a device and revoke all its sessions."""
    session_service = SessionService(db)
    
    success = session_service.block_device(
        str(current_user.id),
        str(device_id)
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found"
        )
    
    return {"message": "Device blocked and sessions revoked"}


@router.post("/refresh")
def refresh_token(
    refresh_token: str,
    request: Request,
    db: Session = Depends(deps.get_db)
):
    """Refresh access token using refresh token."""
    if not settings.REFRESH_TOKEN_ENABLED:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Refresh tokens are disabled"
        )
    
    session_service = SessionService(db)
    
    # Get client info
    ip_address = request.client.host
    user_agent = request.headers.get("user-agent", "")
    
    access_token, new_refresh_token = session_service.refresh_session(
        refresh_token=refresh_token,
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )
    
    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }


@router.get("/activity")
def get_session_activity(
    session_id: Optional[UUID] = None,
    limit: int = 50,
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_user)
):
    """Get session activity for the current user."""
    from app.models.device import SessionActivity
    
    query = db.query(SessionActivity).filter(
        SessionActivity.user_id == current_user.id
    )
    
    if session_id:
        query = query.filter(SessionActivity.session_id == session_id)
    
    activities = query.order_by(
        SessionActivity.created_at.desc()
    ).limit(limit).all()
    
    result = []
    for activity in activities:
        result.append({
            "id": str(activity.id),
            "session_id": str(activity.session_id),
            "activity_type": activity.activity_type,
            "endpoint": activity.endpoint,
            "method": activity.method,
            "status_code": activity.status_code,
            "ip_address": activity.ip_address,
            "is_suspicious": activity.is_suspicious,
            "risk_score": activity.risk_score,
            "created_at": activity.created_at.isoformat(),
            "metadata": activity.metadata
        })
    
    return {
        "activities": result,
        "total_activities": len(result)
    }
