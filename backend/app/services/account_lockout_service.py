"""
Account Lockout Protection Service

This service implements brute-force protection with progressive lockouts,
unlock mechanisms, and admin override capabilities to secure user accounts
from unauthorized access attempts.
"""

import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_, or_

from app.models.security import (
    AccountLockout,
    SecurityEvent,
    SecurityEventType
)
from app.models.user import User
from app.services.security_event_service import SecurityEventService

logger = logging.getLogger(__name__)


class AccountLockoutService:
    """Service for handling account lockout and brute-force protection"""
    
    def __init__(self, db: Session):
        self.db = db
        self.security_service = SecurityEventService(db)
        
        # Lockout configuration
        self.max_failed_attempts = 5  # Max failed attempts before lockout
        self.lockout_duration_minutes = 15  # Initial lockout duration
        self.max_lockout_duration_hours = 24  # Maximum lockout duration
        self.progressive_multiplier = 2  # Multiplier for progressive lockouts
        self.cleanup_days = 30  # Days to keep lockout records
    
    def record_failed_attempt(
        self,
        user_id: Optional[str] = None,
        ip_address: str = None,
        user_agent: Optional[str] = None,
        attempt_type: str = "login",
        email: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Record a failed authentication attempt
        
        Args:
            user_id: User ID (if known)
            ip_address: Source IP address
            user_agent: User agent string
            attempt_type: Type of attempt (login, mfa, etc.)
            email: Email attempted (for logging)
            
        Returns:
            Dict with lockout status and information
        """
        try:
            current_time = datetime.now(timezone.utc)
            
            # Get or create lockout record
            lockout_record = self.db.query(AccountLockout).filter(
                and_(
                    AccountLockout.user_id == user_id,
                    AccountLockout.ip_address == ip_address
                )
            ).first()
            
            if not lockout_record:
                lockout_record = AccountLockout(
                    user_id=user_id,
                    ip_address=ip_address,
                    failed_attempts=0,
                    is_locked=False,
                    lockout_reason=None
                )
                self.db.add(lockout_record)
            
            # Check if currently locked
            if lockout_record.is_locked and lockout_record.locked_until > current_time:
                remaining_time = lockout_record.locked_until - current_time
                
                # Log lockout violation
                self.security_service.log_event(
                    user_id=user_id,
                    event_type="lockout_violation",
                    event_category="security",
                    severity="high",
                    message=f"Login attempt during lockout period for {attempt_type}",
                    ip_address=ip_address,
                    user_agent=user_agent,
                    event_metadata={
                        "attempt_type": attempt_type,
                        "email": email,
                        "remaining_lockout_seconds": int(remaining_time.total_seconds())
                    },
                    risk_score=70
                )
                
                return {
                    "locked": True,
                    "failed_attempts": lockout_record.failed_attempts,
                    "locked_until": lockout_record.locked_until.isoformat(),
                    "remaining_seconds": int(remaining_time.total_seconds()),
                    "message": f"Account locked. Try again in {int(remaining_time.total_seconds() / 60)} minutes."
                }
            
            # If lockout expired, reset
            if lockout_record.is_locked and lockout_record.locked_until <= current_time:
                self._unlock_account(lockout_record, reason="lockout_expired")
            
            # Increment failed attempts
            lockout_record.failed_attempts += 1
            lockout_record.updated_at = current_time
            
            # Check if lockout threshold reached
            should_lock = lockout_record.failed_attempts >= self.max_failed_attempts
            
            if should_lock:
                # Calculate lockout duration (progressive lockout)
                lockout_count = self._get_previous_lockout_count(user_id, ip_address)
                lockout_duration = self._calculate_lockout_duration(lockout_count)
                locked_until = current_time + lockout_duration
                
                # Apply lockout
                lockout_record.is_locked = True
                lockout_record.locked_until = locked_until
                lockout_record.lockout_reason = f"brute_force_{attempt_type}"
                
                # Log account lockout
                self.security_service.log_event(
                    user_id=user_id,
                    event_type=SecurityEventType.ACCOUNT_LOCKED.value,
                    event_category="security",
                    severity="high",
                    message=f"Account locked due to {lockout_record.failed_attempts} failed {attempt_type} attempts",
                    ip_address=ip_address,
                    user_agent=user_agent,
                    event_metadata={
                        "failed_attempts": lockout_record.failed_attempts,
                        "lockout_duration_minutes": int(lockout_duration.total_seconds() / 60),
                        "lockout_count": lockout_count,
                        "attempt_type": attempt_type,
                        "email": email
                    },
                    risk_score=80
                )
                
                self.db.commit()
                
                return {
                    "locked": True,
                    "failed_attempts": lockout_record.failed_attempts,
                    "locked_until": locked_until.isoformat(),
                    "remaining_seconds": int(lockout_duration.total_seconds()),
                    "message": f"Account locked due to too many failed attempts. Try again in {int(lockout_duration.total_seconds() / 60)} minutes."
                }
            
            else:
                # Not locked yet, but record the attempt
                remaining_attempts = self.max_failed_attempts - lockout_record.failed_attempts
                
                # Log failed attempt
                self.security_service.log_event(
                    user_id=user_id,
                    event_type=SecurityEventType.LOGIN_FAILED.value,
                    event_category="auth",
                    severity="medium",
                    message=f"Failed {attempt_type} attempt ({lockout_record.failed_attempts}/{self.max_failed_attempts})",
                    ip_address=ip_address,
                    user_agent=user_agent,
                    event_metadata={
                        "failed_attempts": lockout_record.failed_attempts,
                        "remaining_attempts": remaining_attempts,
                        "attempt_type": attempt_type,
                        "email": email
                    },
                    risk_score=30 + (lockout_record.failed_attempts * 10)
                )
                
                self.db.commit()
                
                return {
                    "locked": False,
                    "failed_attempts": lockout_record.failed_attempts,
                    "remaining_attempts": remaining_attempts,
                    "message": f"{remaining_attempts} attempts remaining before account lockout."
                }
                
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error recording failed attempt: {str(e)}")
            raise e
    
    def record_successful_attempt(
        self,
        user_id: str,
        ip_address: str,
        user_agent: Optional[str] = None,
        attempt_type: str = "login"
    ) -> bool:
        """
        Record a successful authentication attempt and reset failed attempts
        
        Args:
            user_id: User ID
            ip_address: Source IP address
            user_agent: User agent string
            attempt_type: Type of attempt (login, mfa, etc.)
            
        Returns:
            True if reset was performed
        """
        try:
            # Find and reset lockout record
            lockout_record = self.db.query(AccountLockout).filter(
                and_(
                    AccountLockout.user_id == user_id,
                    AccountLockout.ip_address == ip_address
                )
            ).first()
            
            if lockout_record and (lockout_record.failed_attempts > 0 or lockout_record.is_locked):
                # Reset failed attempts
                previous_attempts = lockout_record.failed_attempts
                was_locked = lockout_record.is_locked
                
                lockout_record.failed_attempts = 0
                lockout_record.is_locked = False
                lockout_record.locked_until = None
                lockout_record.lockout_reason = None
                lockout_record.updated_at = datetime.now(timezone.utc)
                
                # Log successful reset
                self.security_service.log_event(
                    user_id=user_id,
                    event_type=SecurityEventType.LOGIN_SUCCESS.value if attempt_type == "login" else "auth_success",
                    event_category="auth",
                    severity="info",
                    message=f"Successful {attempt_type}, lockout reset",
                    ip_address=ip_address,
                    user_agent=user_agent,
                    event_metadata={
                        "previous_failed_attempts": previous_attempts,
                        "was_locked": was_locked,
                        "attempt_type": attempt_type
                    },
                    risk_score=0
                )
                
                self.db.commit()
                return True
            
            return False
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error recording successful attempt: {str(e)}")
            raise e
    
    def check_lockout_status(
        self,
        user_id: Optional[str] = None,
        ip_address: str = None
    ) -> Dict[str, Any]:
        """
        Check current lockout status for user/IP combination
        
        Args:
            user_id: User ID (optional)
            ip_address: IP address
            
        Returns:
            Dict with current lockout status
        """
        current_time = datetime.now(timezone.utc)
        
        lockout_record = self.db.query(AccountLockout).filter(
            and_(
                AccountLockout.user_id == user_id,
                AccountLockout.ip_address == ip_address
            )
        ).first()
        
        if not lockout_record:
            return {
                "locked": False,
                "failed_attempts": 0,
                "remaining_attempts": self.max_failed_attempts
            }
        
        # Check if lockout expired
        if lockout_record.is_locked and lockout_record.locked_until <= current_time:
            self._unlock_account(lockout_record, reason="lockout_expired")
            lockout_record.is_locked = False
        
        if lockout_record.is_locked:
            remaining_time = lockout_record.locked_until - current_time
            return {
                "locked": True,
                "failed_attempts": lockout_record.failed_attempts,
                "locked_until": lockout_record.locked_until.isoformat(),
                "remaining_seconds": int(remaining_time.total_seconds())
            }
        else:
            remaining_attempts = max(0, self.max_failed_attempts - lockout_record.failed_attempts)
            return {
                "locked": False,
                "failed_attempts": lockout_record.failed_attempts,
                "remaining_attempts": remaining_attempts
            }
    
    def admin_unlock_account(
        self,
        user_id: str,
        admin_user_id: str,
        reason: str = "admin_override",
        ip_address: Optional[str] = None
    ) -> bool:
        """
        Admin override to unlock an account
        
        Args:
            user_id: User ID to unlock
            admin_user_id: Admin user performing the unlock
            reason: Reason for unlock
            ip_address: Admin IP address
            
        Returns:
            True if account was unlocked
        """
        try:
            # Find all lockout records for the user
            lockout_records = self.db.query(AccountLockout).filter(
                and_(
                    AccountLockout.user_id == user_id,
                    AccountLockout.is_locked == True
                )
            ).all()
            
            unlocked_count = 0
            for record in lockout_records:
                self._unlock_account(record, reason=reason)
                unlocked_count += 1
            
            if unlocked_count > 0:
                # Log admin unlock
                self.security_service.log_event(
                    user_id=user_id,
                    event_type=SecurityEventType.ACCOUNT_UNLOCKED.value,
                    event_category="admin",
                    severity="medium",
                    message=f"Account unlocked by admin: {reason}",
                    ip_address=ip_address,
                    event_metadata={
                        "admin_user_id": admin_user_id,
                        "unlock_reason": reason,
                        "unlocked_records": unlocked_count
                    },
                    risk_score=10  # Low risk - legitimate admin action
                )
                
                self.db.commit()
                return True
            
            return False
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error unlocking account {user_id}: {str(e)}")
            raise e
    
    def get_locked_accounts(
        self,
        limit: int = 100,
        include_expired: bool = False
    ) -> List[Dict[str, Any]]:
        """
        Get list of currently locked accounts
        
        Args:
            limit: Maximum number of records to return
            include_expired: Whether to include expired lockouts
            
        Returns:
            List of locked account information
        """
        current_time = datetime.now(timezone.utc)
        
        query = self.db.query(AccountLockout).filter(
            AccountLockout.is_locked == True
        )
        
        if not include_expired:
            query = query.filter(AccountLockout.locked_until > current_time)
        
        lockouts = query.order_by(desc(AccountLockout.updated_at)).limit(limit).all()
        
        result = []
        for lockout in lockouts:
            # Get user info if available
            user_info = None
            if lockout.user_id:
                user = self.db.query(User).filter(User.id == lockout.user_id).first()
                if user:
                    user_info = {
                        "id": str(user.id),
                        "email": user.email,
                        "full_name": user.full_name
                    }
            
            remaining_time = None
            if lockout.locked_until and lockout.locked_until > current_time:
                remaining_time = int((lockout.locked_until - current_time).total_seconds())
            
            result.append({
                "id": str(lockout.id),
                "user_id": lockout.user_id,
                "user_info": user_info,
                "ip_address": lockout.ip_address,
                "failed_attempts": lockout.failed_attempts,
                "is_locked": lockout.is_locked,
                "locked_until": lockout.locked_until.isoformat() if lockout.locked_until else None,
                "remaining_seconds": remaining_time,
                "lockout_reason": lockout.lockout_reason,
                "created_at": lockout.created_at.isoformat() if lockout.created_at else None,
                "updated_at": lockout.updated_at.isoformat() if lockout.updated_at else None
            })
        
        return result
    
    def get_lockout_statistics(self, days_back: int = 7) -> Dict[str, Any]:
        """
        Get lockout statistics for monitoring
        
        Args:
            days_back: Number of days to analyze
            
        Returns:
            Dict with lockout statistics
        """
        from sqlalchemy import func
        
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days_back)
        
        # Total lockouts in period
        total_lockouts = self.db.query(AccountLockout).filter(
            and_(
                AccountLockout.created_at >= cutoff_date,
                AccountLockout.is_locked == True
            )
        ).count()
        
        # Currently locked accounts
        currently_locked = self.db.query(AccountLockout).filter(
            and_(
                AccountLockout.is_locked == True,
                AccountLockout.locked_until > datetime.now(timezone.utc)
            )
        ).count()
        
        # Top IP addresses by failed attempts
        top_ips = self.db.query(
            AccountLockout.ip_address,
            func.sum(AccountLockout.failed_attempts).label('total_attempts')
        ).filter(
            AccountLockout.created_at >= cutoff_date
        ).group_by(AccountLockout.ip_address).order_by(
            desc('total_attempts')
        ).limit(10).all()
        
        return {
            "period_days": days_back,
            "total_lockouts": total_lockouts,
            "currently_locked": currently_locked,
            "top_attacking_ips": [
                {"ip": row.ip_address, "failed_attempts": row.total_attempts}
                for row in top_ips
            ]
        }
    
    def cleanup_old_lockouts(self, days_to_keep: int = None) -> int:
        """
        Clean up old lockout records
        
        Args:
            days_to_keep: Number of days to keep records (uses default if None)
            
        Returns:
            Number of records deleted
        """
        days_to_keep = days_to_keep or self.cleanup_days
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days_to_keep)
        
        # Delete old, unlocked records
        deleted_count = self.db.query(AccountLockout).filter(
            and_(
                AccountLockout.created_at < cutoff_date,
                AccountLockout.is_locked == False
            )
        ).delete(synchronize_session=False)
        
        self.db.commit()
        
        logger.info(f"Cleaned up {deleted_count} old lockout records")
        return deleted_count
    
    def _unlock_account(self, lockout_record: AccountLockout, reason: str):
        """Internal method to unlock an account"""
        lockout_record.is_locked = False
        lockout_record.locked_until = None
        lockout_record.lockout_reason = None
        lockout_record.updated_at = datetime.now(timezone.utc)
    
    def _get_previous_lockout_count(self, user_id: Optional[str], ip_address: str) -> int:
        """Get count of previous lockouts for progressive lockout calculation"""
        if not user_id:
            return 0
        
        # Count lockouts in the last 24 hours
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=24)
        
        count = self.db.query(AccountLockout).filter(
            and_(
                AccountLockout.user_id == user_id,
                AccountLockout.created_at >= cutoff_time,
                AccountLockout.lockout_reason.like("brute_force_%")
            )
        ).count()
        
        return count
    
    def _calculate_lockout_duration(self, lockout_count: int) -> timedelta:
        """Calculate progressive lockout duration"""
        # Progressive lockout: 15 min, 30 min, 1 hour, 2 hours, 4 hours, max 24 hours
        base_minutes = self.lockout_duration_minutes
        duration_minutes = min(
            base_minutes * (self.progressive_multiplier ** lockout_count),
            self.max_lockout_duration_hours * 60
        )
        
        return timedelta(minutes=duration_minutes)
