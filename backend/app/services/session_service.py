"""Session management service with device tracking and refresh tokens."""

import secrets
import hashlib
from typing import Optional, Dict, Any, List, Tuple
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from user_agents import parse

from app.core.config import settings
from app.models.security import Session as UserSession
from app.models.device import Device, RefreshToken, SessionActivity
from app.models.user import User
from app.core.security import create_access_token


class SessionService:
    """Service for managing user sessions, devices, and refresh tokens."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_session(
        self,
        user_id: str,
        ip_address: str,
        user_agent: str,
        login_method: str = "password",
        metadata: Optional[Dict[str, Any]] = None
    ) -> Tuple[UserSession, Optional[str]]:
        """
        Create a new user session with device tracking.
        
        Returns:
            Tuple of (session, refresh_token)
        """
        # Parse user agent for device information
        device_info = self._parse_user_agent(user_agent)
        
        # Get or create device
        device = self._get_or_create_device(
            user_id, ip_address, user_agent, device_info
        )
        
        # Generate session token
        session_token = secrets.token_urlsafe(32)
        
        # Create session
        session = UserSession(
            user_id=user_id,
            device_id=device.id,
            session_token=session_token,
            ip_address=ip_address,
            user_agent=user_agent,
            login_method=login_method,
            metadata=metadata,
            expires_at=datetime.utcnow() + timedelta(hours=24),  # 24 hour session
            # Legacy fields for backward compatibility
            device=device_info.get('device_type'),
            ip=ip_address,
            ua=user_agent
        )
        
        self.db.add(session)
        
        # Create refresh token if enabled
        refresh_token = None
        if settings.REFRESH_TOKEN_ENABLED:
            refresh_token = self._create_refresh_token(session, device)
        
        # Log session activity
        self._log_activity(
            session.id, user_id, "login", 
            ip_address=ip_address, user_agent=user_agent
        )
        
        # Cleanup old sessions if user has too many
        self._cleanup_old_sessions(user_id)
        
        self.db.commit()
        return session, refresh_token
    
    def refresh_session(
        self, 
        refresh_token: str,
        ip_address: str,
        user_agent: str
    ) -> Tuple[Optional[str], Optional[str]]:
        """
        Refresh session using refresh token with rotation.
        
        Returns:
            Tuple of (new_access_token, new_refresh_token)
        """
        if not settings.REFRESH_TOKEN_ENABLED:
            return None, None
        
        # Hash the provided refresh token
        token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
        
        # Find the refresh token
        refresh_token_record = self.db.query(RefreshToken).filter(
            RefreshToken.token_hash == token_hash,
            RefreshToken.is_revoked == False,
            RefreshToken.expires_at > datetime.utcnow()
        ).first()
        
        if not refresh_token_record:
            return None, None
        
        # Check for token reuse (security breach detection)
        if refresh_token_record.used_at:
            # Token reuse detected - revoke entire token family
            self._revoke_token_family(
                refresh_token_record.token_family, 
                "reuse_detected"
            )
            return None, None
        
        # Mark token as used
        refresh_token_record.used_at = datetime.utcnow()
        
        # Get associated session
        session = refresh_token_record.session
        if not session or session.revoked:
            return None, None
        
        # Update session last seen
        session.last_seen_at = datetime.utcnow()
        session.ip_address = ip_address
        session.user_agent = user_agent
        
        # Create new access token
        access_token = create_access_token(
            data={"sub": str(session.user_id)},
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        
        # Create new refresh token (rotation)
        new_refresh_token = self._create_refresh_token(
            session, 
            refresh_token_record.device,
            token_family=refresh_token_record.token_family
        )
        
        # Link old token to new one
        refresh_token_record.replaced_by = new_refresh_token
        
        # Log activity
        self._log_activity(
            session.id, session.user_id, "token_refresh",
            ip_address=ip_address, user_agent=user_agent
        )
        
        self.db.commit()
        return access_token, new_refresh_token
    
    def revoke_session(
        self, 
        session_id: str, 
        user_id: str,
        reason: str = "manual_revoke"
    ) -> bool:
        """Revoke a specific session."""
        session = self.db.query(UserSession).filter(
            UserSession.id == session_id,
            UserSession.user_id == user_id
        ).first()
        
        if not session:
            return False
        
        # Revoke session
        session.revoked = True
        session.revoked_at = datetime.utcnow()
        session.revoked_reason = reason
        
        # Revoke associated refresh tokens
        for refresh_token in session.refresh_tokens:
            if not refresh_token.is_revoked:
                refresh_token.is_revoked = True
                refresh_token.revoked_at = datetime.utcnow()
                refresh_token.revoked_reason = reason
        
        # Log activity
        self._log_activity(
            session.id, user_id, "logout",
            metadata={"reason": reason}
        )
        
        self.db.commit()
        return True
    
    def revoke_all_sessions(
        self, 
        user_id: str, 
        except_session_id: Optional[str] = None,
        reason: str = "revoke_all"
    ) -> int:
        """Revoke all sessions for a user except optionally one."""
        query = self.db.query(UserSession).filter(
            UserSession.user_id == user_id,
            UserSession.revoked == False
        )
        
        if except_session_id:
            query = query.filter(UserSession.id != except_session_id)
        
        sessions = query.all()
        revoked_count = 0
        
        for session in sessions:
            session.revoked = True
            session.revoked_at = datetime.utcnow()
            session.revoked_reason = reason
            
            # Revoke refresh tokens
            for refresh_token in session.refresh_tokens:
                if not refresh_token.is_revoked:
                    refresh_token.is_revoked = True
                    refresh_token.revoked_at = datetime.utcnow()
                    refresh_token.revoked_reason = reason
            
            revoked_count += 1
        
        self.db.commit()
        return revoked_count
    
    def get_user_sessions(
        self, 
        user_id: str, 
        include_revoked: bool = False
    ) -> List[Dict[str, Any]]:
        """Get all sessions for a user with device information."""
        query = self.db.query(UserSession).filter(
            UserSession.user_id == user_id
        )
        
        if not include_revoked:
            query = query.filter(UserSession.revoked == False)
        
        sessions = query.order_by(UserSession.last_seen_at.desc()).all()
        
        result = []
        for session in sessions:
            device_info = {}
            if session.device:
                device_info = {
                    "device_name": session.device.device_name,
                    "device_type": session.device.device_type,
                    "browser_name": session.device.browser_name,
                    "os_name": session.device.os_name,
                    "country": session.device.country,
                    "is_trusted": session.device.is_trusted
                }
            
            result.append({
                "id": str(session.id),
                "ip_address": session.ip_address,
                "login_method": session.login_method,
                "created_at": session.created_at.isoformat(),
                "last_seen_at": session.last_seen_at.isoformat(),
                "expires_at": session.expires_at.isoformat(),
                "is_current": not session.revoked,
                "revoked_reason": session.revoked_reason,
                "device": device_info
            })
        
        return result
    
    def get_user_devices(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all devices for a user."""
        devices = self.db.query(Device).filter(
            Device.user_id == user_id
        ).order_by(Device.last_seen_at.desc()).all()
        
        result = []
        for device in devices:
            active_sessions = len([s for s in device.sessions if not s.revoked])
            
            result.append({
                "id": str(device.id),
                "device_name": device.device_name,
                "device_type": device.device_type,
                "browser_name": device.browser_name,
                "browser_version": device.browser_version,
                "os_name": device.os_name,
                "os_version": device.os_version,
                "country": device.country,
                "city": device.city,
                "is_trusted": device.is_trusted,
                "is_blocked": device.is_blocked,
                "active_sessions": active_sessions,
                "first_seen_at": device.first_seen_at.isoformat(),
                "last_seen_at": device.last_seen_at.isoformat()
            })
        
        return result
    
    def trust_device(self, user_id: str, device_id: str) -> bool:
        """Mark a device as trusted."""
        device = self.db.query(Device).filter(
            Device.id == device_id,
            Device.user_id == user_id
        ).first()
        
        if device:
            device.is_trusted = True
            device.updated_at = datetime.utcnow()
            self.db.commit()
            return True
        
        return False
    
    def block_device(self, user_id: str, device_id: str) -> bool:
        """Block a device and revoke all its sessions."""
        device = self.db.query(Device).filter(
            Device.id == device_id,
            Device.user_id == user_id
        ).first()
        
        if device:
            device.is_blocked = True
            device.updated_at = datetime.utcnow()
            
            # Revoke all sessions for this device
            for session in device.sessions:
                if not session.revoked:
                    session.revoked = True
                    session.revoked_at = datetime.utcnow()
                    session.revoked_reason = "device_blocked"
            
            self.db.commit()
            return True
        
        return False
    
    def cleanup_expired_sessions(self) -> int:
        """Clean up expired sessions and refresh tokens."""
        now = datetime.utcnow()
        
        # Mark expired sessions as revoked
        expired_sessions = self.db.query(UserSession).filter(
            UserSession.expires_at < now,
            UserSession.revoked == False
        ).all()
        
        for session in expired_sessions:
            session.revoked = True
            session.revoked_at = now
            session.revoked_reason = "expired"
        
        # Delete expired refresh tokens
        expired_tokens = self.db.query(RefreshToken).filter(
            RefreshToken.expires_at < now
        )
        expired_token_count = expired_tokens.count()
        expired_tokens.delete()
        
        self.db.commit()
        return len(expired_sessions) + expired_token_count
    
    def _parse_user_agent(self, user_agent: str) -> Dict[str, Any]:
        """Parse user agent string to extract device information."""
        try:
            parsed = parse(user_agent)
            return {
                "browser_name": parsed.browser.family,
                "browser_version": parsed.browser.version_string,
                "os_name": parsed.os.family,
                "os_version": parsed.os.version_string,
                "device_type": "mobile" if parsed.is_mobile else "tablet" if parsed.is_tablet else "desktop"
            }
        except Exception:
            return {
                "browser_name": "Unknown",
                "browser_version": "",
                "os_name": "Unknown",
                "os_version": "",
                "device_type": "unknown"
            }
    
    def _get_or_create_device(
        self, 
        user_id: str, 
        ip_address: str, 
        user_agent: str,
        device_info: Dict[str, Any]
    ) -> Device:
        """Get existing device or create new one."""
        # Generate device fingerprint
        device_fingerprint = hashlib.sha256(
            f"{user_id}:{user_agent}:{device_info.get('os_name')}:{device_info.get('browser_name')}".encode()
        ).hexdigest()[:16]
        
        # Look for existing device
        device = self.db.query(Device).filter(
            Device.device_id == device_fingerprint,
            Device.user_id == user_id
        ).first()
        
        if device:
            # Update last seen and IP
            device.last_seen_at = datetime.utcnow()
            device.ip_address = ip_address
            return device
        
        # Create new device
        device = Device(
            user_id=user_id,
            device_id=device_fingerprint,
            device_name=f"{device_info.get('os_name')} {device_info.get('browser_name')}",
            device_type=device_info.get('device_type'),
            user_agent=user_agent,
            browser_name=device_info.get('browser_name'),
            browser_version=device_info.get('browser_version'),
            os_name=device_info.get('os_name'),
            os_version=device_info.get('os_version'),
            ip_address=ip_address
        )
        
        self.db.add(device)
        return device
    
    def _create_refresh_token(
        self, 
        session: UserSession, 
        device: Device,
        token_family: Optional[str] = None
    ) -> str:
        """Create a new refresh token."""
        # Generate token and family
        token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        family = token_family or secrets.token_urlsafe(16)
        
        # Create refresh token record
        refresh_token = RefreshToken(
            user_id=session.user_id,
            session_id=session.id,
            device_id=device.id,
            token_hash=token_hash,
            token_family=family,
            expires_at=datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        )
        
        self.db.add(refresh_token)
        return token
    
    def _revoke_token_family(self, token_family: str, reason: str) -> None:
        """Revoke all tokens in a family (security breach response)."""
        tokens = self.db.query(RefreshToken).filter(
            RefreshToken.token_family == token_family,
            RefreshToken.is_revoked == False
        ).all()
        
        for token in tokens:
            token.is_revoked = True
            token.revoked_at = datetime.utcnow()
            token.revoked_reason = reason
    
    def _log_activity(
        self,
        session_id: str,
        user_id: str,
        activity_type: str,
        endpoint: Optional[str] = None,
        method: Optional[str] = None,
        status_code: Optional[int] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> None:
        """Log session activity."""
        try:
            activity = SessionActivity(
                session_id=session_id,
                user_id=user_id,
                activity_type=activity_type,
                endpoint=endpoint,
                method=method,
                status_code=status_code,
                ip_address=ip_address,
                user_agent=user_agent,
                metadata=metadata
            )
            self.db.add(activity)
        except Exception:
            # Don't fail session operations due to logging issues
            pass
    
    def _cleanup_old_sessions(self, user_id: str) -> None:
        """Clean up old sessions if user has too many."""
        if settings.MAX_SESSIONS_PER_USER <= 0:
            return
        
        # Get active sessions ordered by last seen
        sessions = self.db.query(UserSession).filter(
            UserSession.user_id == user_id,
            UserSession.revoked == False
        ).order_by(UserSession.last_seen_at.desc()).all()
        
        # Revoke excess sessions
        if len(sessions) >= settings.MAX_SESSIONS_PER_USER:
            excess_sessions = sessions[settings.MAX_SESSIONS_PER_USER - 1:]
            for session in excess_sessions:
                session.revoked = True
                session.revoked_at = datetime.utcnow()
                session.revoked_reason = "session_limit_exceeded"
