"""
Enhanced Session Management Service

This service handles secure session management with device fingerprinting,
JWT refresh token rotation, session tracking, and revocation capabilities
using the new enhanced security models.
"""

import logging
import secrets
import hashlib
import jwt
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_, or_
import uuid

from app.models.security import (
    EnhancedUserSession, 
    DeviceFingerprint, 
    SessionStatus, 
    SecurityEvent, 
    SecurityEventType
)
from app.models.user import User
from app.core.config import settings
from app.services.security_event_service import SecurityEventService

logger = logging.getLogger(__name__)


class EnhancedSessionService:
    """Service for enhanced session management with device fingerprinting"""
    
    def __init__(self, db: Session):
        self.db = db
        self.security_service = SecurityEventService(db)
        self.jwt_secret = getattr(settings, 'SECRET_KEY', 'fallback-secret-key')
        self.jwt_algorithm = getattr(settings, 'ALGORITHM', 'HS256')
        
        # Session configuration
        self.access_token_expire_minutes = getattr(settings, 'ACCESS_TOKEN_EXPIRE_MINUTES', 30)
        self.refresh_token_expire_days = getattr(settings, 'REFRESH_TOKEN_EXPIRE_DAYS', 7)
    
    def generate_device_fingerprint(
        self, 
        user_agent: Optional[str],
        screen_resolution: Optional[str] = None,
        timezone_offset: Optional[str] = None,
        language: Optional[str] = None
    ) -> str:
        """
        Generate device fingerprint from client characteristics
        """
        fingerprint_data = {
            'user_agent': user_agent or '',
            'screen_resolution': screen_resolution or '',
            'timezone_offset': timezone_offset or '',
            'language': language or ''
        }
        
        fingerprint_string = '|'.join([
            fingerprint_data['user_agent'],
            fingerprint_data['screen_resolution'],
            fingerprint_data['timezone_offset'],
            fingerprint_data['language']
        ])
        
        return hashlib.sha256(fingerprint_string.encode()).hexdigest()
    
    def create_session(
        self,
        user_id: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        location_country: Optional[str] = None,
        location_city: Optional[str] = None,
        screen_resolution: Optional[str] = None,
        timezone_offset: Optional[str] = None,
        language: Optional[str] = None,
        is_mfa_verified: bool = False
    ) -> Dict[str, Any]:
        """
        Create new enhanced session with device fingerprinting
        """
        try:
            # Generate device fingerprint
            device_fingerprint = self.generate_device_fingerprint(
                user_agent=user_agent,
                screen_resolution=screen_resolution,
                timezone_offset=timezone_offset,
                language=language
            )
            
            # Check if this device has been seen before
            existing_device = self.db.query(DeviceFingerprint).filter(
                and_(
                    DeviceFingerprint.user_id == user_id,
                    DeviceFingerprint.fingerprint_hash == device_fingerprint
                )
            ).first()
            
            if existing_device:
                # Update existing device
                existing_device.last_seen = datetime.now(timezone.utc)
                existing_device.total_logins += 1
                device_trusted = existing_device.is_trusted
                device_suspicious = existing_device.is_suspicious
            else:
                # Create new device fingerprint record
                new_device = DeviceFingerprint(
                    user_id=user_id,
                    fingerprint_hash=device_fingerprint,
                    browser_name=self._extract_browser_name(user_agent),
                    os_name=self._extract_os_name(user_agent),
                    screen_resolution=screen_resolution,
                    timezone=timezone_offset,
                    language=language,
                    is_trusted=False,  # New devices start as untrusted
                    is_suspicious=False,
                    total_logins=1
                )
                self.db.add(new_device)
                device_trusted = False
                device_suspicious = False
            
            # Generate session and refresh tokens
            session_token = secrets.token_urlsafe(32)
            refresh_token = secrets.token_urlsafe(32)
            
            # Create session record
            session_expires = datetime.now(timezone.utc) + timedelta(minutes=self.access_token_expire_minutes)
            
            enhanced_session = EnhancedUserSession(
                user_id=user_id,
                session_token=session_token,
                refresh_token=refresh_token,
                device_fingerprint=device_fingerprint,
                user_agent=user_agent,
                ip_address=ip_address,
                location_country=location_country,
                location_city=location_city,
                status=SessionStatus.ACTIVE.value,
                is_mfa_verified=is_mfa_verified,
                expires_at=session_expires
            )
            
            self.db.add(enhanced_session)
            self.db.commit()
            
            # Log session creation
            self.security_service.log_event(
                user_id=user_id,
                session_id=str(enhanced_session.id),
                event_type=SecurityEventType.SESSION_CREATED.value,
                event_category="session",
                severity="info",
                message="New session created",
                ip_address=ip_address,
                user_agent=user_agent,
                event_metadata={
                    "device_fingerprint": device_fingerprint,
                    "device_trusted": device_trusted,
                    "device_suspicious": device_suspicious,
                    "mfa_verified": is_mfa_verified
                },
                risk_score=10 if not device_trusted else 0
            )
            
            # Generate JWT access token
            jwt_payload = {
                "user_id": user_id,
                "session_id": str(enhanced_session.id),
                "device_fingerprint": device_fingerprint,
                "mfa_verified": is_mfa_verified,
                "exp": session_expires,
                "iat": datetime.now(timezone.utc)
            }
            
            access_token = jwt.encode(jwt_payload, self.jwt_secret, algorithm=self.jwt_algorithm)
            
            return {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "session_id": str(enhanced_session.id),
                "expires_at": session_expires.isoformat(),
                "device_trusted": device_trusted,
                "device_fingerprint": device_fingerprint,
                "token_type": "bearer"
            }
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating session for user {user_id}: {str(e)}")
            raise e
    
    def refresh_session(
        self,
        refresh_token: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Refresh session using refresh token with rotation
        """
        try:
            # Find session by refresh token
            session = self.db.query(EnhancedUserSession).filter(
                and_(
                    EnhancedUserSession.refresh_token == refresh_token,
                    EnhancedUserSession.status == SessionStatus.ACTIVE.value,
                    EnhancedUserSession.expires_at > datetime.now(timezone.utc)
                )
            ).first()
            
            if not session:
                raise ValueError("Invalid or expired refresh token")
            
            # Verify IP address consistency (optional security check)
            if ip_address and session.ip_address and ip_address != session.ip_address:
                # Log suspicious activity
                self.security_service.log_event(
                    user_id=session.user_id,
                    session_id=str(session.id),
                    event_type=SecurityEventType.SUSPICIOUS_ACTIVITY.value,
                    event_category="session",
                    severity="medium",
                    message="Session refresh from different IP address",
                    ip_address=ip_address,
                    user_agent=user_agent,
                    event_metadata={
                        "original_ip": session.ip_address,
                        "new_ip": ip_address
                    },
                    risk_score=50
                )
            
            # Generate new tokens (token rotation)
            new_session_token = secrets.token_urlsafe(32)
            new_refresh_token = secrets.token_urlsafe(32)
            new_expires = datetime.now(timezone.utc) + timedelta(minutes=self.access_token_expire_minutes)
            
            # Update session
            session.session_token = new_session_token
            session.refresh_token = new_refresh_token
            session.expires_at = new_expires
            session.last_activity = datetime.now(timezone.utc)
            
            # Update IP if changed
            if ip_address:
                session.ip_address = ip_address
            
            self.db.commit()
            
            # Generate new JWT access token
            jwt_payload = {
                "user_id": session.user_id,
                "session_id": str(session.id),
                "device_fingerprint": session.device_fingerprint,
                "mfa_verified": session.is_mfa_verified,
                "exp": new_expires,
                "iat": datetime.now(timezone.utc)
            }
            
            new_access_token = jwt.encode(jwt_payload, self.jwt_secret, algorithm=self.jwt_algorithm)
            
            return {
                "access_token": new_access_token,
                "refresh_token": new_refresh_token,
                "session_id": str(session.id),
                "expires_at": new_expires.isoformat(),
                "token_type": "bearer"
            }
            
        except Exception as e:
            logger.error(f"Error refreshing session: {str(e)}")
            raise e
    
    def revoke_session(
        self,
        session_id: str,
        user_id: str,
        reason: str = "user_request",
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> bool:
        """
        Revoke specific session
        """
        try:
            session = self.db.query(EnhancedUserSession).filter(
                and_(
                    EnhancedUserSession.id == session_id,
                    EnhancedUserSession.user_id == user_id,
                    EnhancedUserSession.status == SessionStatus.ACTIVE.value
                )
            ).first()
            
            if not session:
                return False
            
            # Revoke session
            session.status = SessionStatus.REVOKED.value
            session.revoked_at = datetime.now(timezone.utc)
            session.revoked_reason = reason
            
            self.db.commit()
            
            # Log session revocation
            self.security_service.log_event(
                user_id=user_id,
                session_id=session_id,
                event_type=SecurityEventType.SESSION_REVOKED.value,
                event_category="session",
                severity="info",
                message=f"Session revoked: {reason}",
                ip_address=ip_address,
                user_agent=user_agent,
                event_metadata={"revocation_reason": reason},
                risk_score=0
            )
            
            return True
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error revoking session {session_id}: {str(e)}")
            raise e
    
    def revoke_all_sessions(
        self,
        user_id: str,
        except_session_id: Optional[str] = None,
        reason: str = "user_request",
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> int:
        """
        Revoke all sessions for a user
        """
        try:
            query = self.db.query(EnhancedUserSession).filter(
                and_(
                    EnhancedUserSession.user_id == user_id,
                    EnhancedUserSession.status == SessionStatus.ACTIVE.value
                )
            )
            
            if except_session_id:
                query = query.filter(EnhancedUserSession.id != except_session_id)
            
            sessions = query.all()
            revoked_count = len(sessions)
            
            # Revoke all sessions
            revoke_time = datetime.now(timezone.utc)
            for session in sessions:
                session.status = SessionStatus.REVOKED.value
                session.revoked_at = revoke_time
                session.revoked_reason = reason
            
            self.db.commit()
            
            # Log bulk revocation
            self.security_service.log_event(
                user_id=user_id,
                event_type="bulk_session_revocation",
                event_category="session",
                severity="info",
                message=f"Revoked {revoked_count} sessions: {reason}",
                ip_address=ip_address,
                user_agent=user_agent,
                event_metadata={
                    "revocation_reason": reason,
                    "sessions_revoked": revoked_count,
                    "except_session": except_session_id
                },
                risk_score=0
            )
            
            return revoked_count
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error revoking all sessions for user {user_id}: {str(e)}")
            raise e
    
    def get_user_sessions(
        self,
        user_id: str,
        include_revoked: bool = False,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Get all sessions for a user
        """
        query = self.db.query(EnhancedUserSession).filter(
            EnhancedUserSession.user_id == user_id
        )
        
        if not include_revoked:
            query = query.filter(EnhancedUserSession.status == SessionStatus.ACTIVE.value)
        
        sessions = query.order_by(desc(EnhancedUserSession.created_at)).limit(limit).all()
        
        result = []
        for session in sessions:
            # Get device info if available
            device_info = self.db.query(DeviceFingerprint).filter(
                and_(
                    DeviceFingerprint.user_id == user_id,
                    DeviceFingerprint.fingerprint_hash == session.device_fingerprint
                )
            ).first()
            
            result.append({
                "id": str(session.id),
                "device_fingerprint": session.device_fingerprint,
                "device_name": device_info.device_name if device_info else None,
                "browser_name": device_info.browser_name if device_info else None,
                "os_name": device_info.os_name if device_info else None,
                "ip_address": session.ip_address,
                "location_country": session.location_country,
                "location_city": session.location_city,
                "status": session.status,
                "is_mfa_verified": session.is_mfa_verified,
                "is_current": session.status == SessionStatus.ACTIVE.value and session.expires_at > datetime.now(timezone.utc),
                "created_at": session.created_at.isoformat() if session.created_at else None,
                "last_activity": session.last_activity.isoformat() if session.last_activity else None,
                "expires_at": session.expires_at.isoformat() if session.expires_at else None,
                "revoked_at": session.revoked_at.isoformat() if session.revoked_at else None,
                "revoked_reason": session.revoked_reason
            })
        
        return result
    
    def validate_session(self, session_token: str) -> Optional[EnhancedUserSession]:
        """
        Validate session token and return session if valid
        """
        session = self.db.query(EnhancedUserSession).filter(
            and_(
                EnhancedUserSession.session_token == session_token,
                EnhancedUserSession.status == SessionStatus.ACTIVE.value,
                EnhancedUserSession.expires_at > datetime.now(timezone.utc)
            )
        ).first()
        
        if session:
            # Update last activity
            session.last_activity = datetime.now(timezone.utc)
            self.db.commit()
        
        return session
    
    def cleanup_expired_sessions(self, days_to_keep: int = 30) -> int:
        """
        Clean up old and expired sessions
        """
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days_to_keep)
        
        deleted_count = self.db.query(EnhancedUserSession).filter(
            or_(
                EnhancedUserSession.expires_at < cutoff_date,
                and_(
                    EnhancedUserSession.status != SessionStatus.ACTIVE.value,
                    EnhancedUserSession.created_at < cutoff_date
                )
            )
        ).delete(synchronize_session=False)
        
        self.db.commit()
        
        logger.info(f"Cleaned up {deleted_count} expired sessions")
        return deleted_count
    
    def _extract_browser_name(self, user_agent: Optional[str]) -> Optional[str]:
        """Extract browser name from user agent"""
        if not user_agent:
            return None
        
        user_agent = user_agent.lower()
        if 'chrome' in user_agent:
            return 'Chrome'
        elif 'firefox' in user_agent:
            return 'Firefox'
        elif 'safari' in user_agent:
            return 'Safari'
        elif 'edge' in user_agent:
            return 'Edge'
        else:
            return 'Unknown'
    
    def _extract_os_name(self, user_agent: Optional[str]) -> Optional[str]:
        """Extract OS name from user agent"""
        if not user_agent:
            return None
        
        user_agent = user_agent.lower()
        if 'windows' in user_agent:
            return 'Windows'
        elif 'macintosh' or 'mac os' in user_agent:
            return 'macOS'
        elif 'linux' in user_agent:
            return 'Linux'
        elif 'android' in user_agent:
            return 'Android'
        elif 'iphone' or 'ipad' in user_agent:
            return 'iOS'
        else:
            return 'Unknown'
