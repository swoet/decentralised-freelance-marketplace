from __future__ import annotations
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, Integer, Index, JSON
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime, timezone
import uuid
from enum import Enum

from .base import Base


class MFAType(str, Enum):
    """Multi-Factor Authentication types"""
    TOTP = "totp"
    WEBAUTHN = "webauthn"
    BACKUP_CODE = "backup_code"


class SessionStatus(str, Enum):
    """Session status types"""
    ACTIVE = "active"
    EXPIRED = "expired"
    REVOKED = "revoked"
    SUSPICIOUS = "suspicious"


class SecurityEventType(str, Enum):
    """Security event types for audit logging"""
    LOGIN_SUCCESS = "login_success"
    LOGIN_FAILED = "login_failed"
    MFA_ENABLED = "mfa_enabled"
    MFA_DISABLED = "mfa_disabled"
    MFA_SUCCESS = "mfa_success"
    MFA_FAILED = "mfa_failed"
    PASSWORD_CHANGED = "password_changed"
    SESSION_CREATED = "session_created"
    SESSION_EXPIRED = "session_expired"
    SESSION_REVOKED = "session_revoked"
    SUSPICIOUS_ACTIVITY = "suspicious_activity"
    RATE_LIMIT_EXCEEDED = "rate_limit_exceeded"
    ACCOUNT_LOCKED = "account_locked"
    ACCOUNT_UNLOCKED = "account_unlocked"


class Session(Base):
    __tablename__ = "sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    device_id = Column(UUID(as_uuid=True), ForeignKey("devices.id"), nullable=True, index=True)
    
    # Session identification
    session_token = Column(String, nullable=False, unique=True, index=True)
    
    # Legacy device info (kept for backward compatibility)
    device = Column(String, nullable=True)
    ip = Column(String, nullable=True)
    ua = Column(String, nullable=True)
    
    # Enhanced session data
    ip_address = Column(String, nullable=True, index=True)
    user_agent = Column(Text, nullable=True)
    
    # Session metadata
    login_method = Column(String, nullable=True)  # password, oauth, 2fa
    session_metadata = Column(JSONB, nullable=True)
    
    # Session status and expiration
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)
    last_seen_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    revoked = Column(Boolean, nullable=False, default=False)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    revoked_reason = Column(String, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="sessions")
    device = relationship("Device", back_populates="sessions")
    refresh_tokens = relationship("RefreshToken", back_populates="session", cascade="all, delete-orphan")


class BackupCode(Base):
    __tablename__ = "backup_codes"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    code_hash = Column(String, nullable=False, index=True)
    used_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User")


class ConsentLog(Base):
    __tablename__ = "consent_logs"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    doc = Column(String, nullable=False)  # e.g., 'tos' or 'privacy'
    version = Column(String, nullable=False)
    consented_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    ip = Column(String, nullable=True)
    ua = Column(String, nullable=True)

    user = relationship("User")


# TIER 2: Enhanced Security Models

class UserMFA(Base):
    """Multi-Factor Authentication settings for users"""
    __tablename__ = "user_mfa"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    mfa_type = Column(String(20), nullable=False)  # totp, webauthn, backup_code
    secret_key = Column(Text, nullable=True)  # Encrypted TOTP secret
    backup_codes = Column(JSON, nullable=True)  # Encrypted backup codes
    webauthn_credentials = Column(JSON, nullable=True)  # WebAuthn credential data
    is_enabled = Column(Boolean, default=True, nullable=False)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="mfa_settings")

    # Indexes for performance
    __table_args__ = (
        Index('idx_user_mfa_user_type', 'user_id', 'mfa_type'),
        Index('idx_user_mfa_enabled', 'user_id', 'is_enabled'),
    )


class EnhancedUserSession(Base):
    """Enhanced user session management with device fingerprinting"""
    __tablename__ = "enhanced_user_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    session_token = Column(String(255), nullable=False, unique=True, index=True)
    refresh_token = Column(String(255), nullable=True, unique=True, index=True)
    device_fingerprint = Column(String(255), nullable=True, index=True)
    user_agent = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True, index=True)  # IPv6 compatible
    location_country = Column(String(10), nullable=True)
    location_city = Column(String(100), nullable=True)
    status = Column(String(20), default=SessionStatus.ACTIVE.value, nullable=False)
    is_mfa_verified = Column(Boolean, default=False, nullable=False)
    last_activity = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    revoked_reason = Column(String(100), nullable=True)

    # Relationships
    user = relationship("User")

    # Indexes for performance and security queries
    __table_args__ = (
        Index('idx_enhanced_sessions_user_status', 'user_id', 'status'),
        Index('idx_enhanced_sessions_expires', 'expires_at'),
        Index('idx_enhanced_sessions_fingerprint', 'device_fingerprint'),
    )


class RateLimitRule(Base):
    """Rate limiting rules configuration"""
    __tablename__ = "rate_limit_rules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rule_name = Column(String(100), nullable=False, unique=True)
    endpoint_pattern = Column(String(200), nullable=False)  # Regex pattern for endpoints
    method = Column(String(10), nullable=True)  # HTTP method, NULL for all
    limit_per_minute = Column(Integer, nullable=False, default=60)
    limit_per_hour = Column(Integer, nullable=False, default=1000)
    limit_per_day = Column(Integer, nullable=False, default=10000)
    burst_limit = Column(Integer, nullable=False, default=10)  # Burst allowance
    is_enabled = Column(Boolean, default=True, nullable=False)
    applies_to_authenticated = Column(Boolean, default=True, nullable=False)
    applies_to_anonymous = Column(Boolean, default=True, nullable=False)
    whitelist_ips = Column(JSON, nullable=True)  # IP whitelist
    blacklist_ips = Column(JSON, nullable=True)  # IP blacklist
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Indexes
    __table_args__ = (
        Index('idx_rate_limit_enabled', 'is_enabled'),
        Index('idx_rate_limit_pattern', 'endpoint_pattern'),
    )


class RateLimitViolation(Base):
    """Rate limit violation tracking"""
    __tablename__ = "rate_limit_violations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rule_id = Column(UUID(as_uuid=True), ForeignKey("rate_limit_rules.id"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)  # NULL for anonymous
    ip_address = Column(String(45), nullable=False, index=True)
    endpoint = Column(String(200), nullable=False)
    method = Column(String(10), nullable=False)
    user_agent = Column(Text, nullable=True)
    violation_count = Column(Integer, default=1, nullable=False)
    time_window = Column(String(20), nullable=False)  # minute, hour, day
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)

    # Relationships
    rule = relationship("RateLimitRule")
    user = relationship("User")

    # Indexes for cleanup and analysis
    __table_args__ = (
        Index('idx_rate_violations_expires', 'expires_at'),
        Index('idx_rate_violations_created', 'created_at'),
    )


class SecurityEvent(Base):
    """Comprehensive security event logging"""
    __tablename__ = "security_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)  # NULL for anonymous events
    session_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    event_type = Column(String(50), nullable=False, index=True)
    event_category = Column(String(30), nullable=False, index=True)  # auth, session, mfa, etc.
    severity = Column(String(20), default="info", nullable=False, index=True)  # low, medium, high, critical
    ip_address = Column(String(45), nullable=True, index=True)
    user_agent = Column(Text, nullable=True)
    endpoint = Column(String(200), nullable=True)
    method = Column(String(10), nullable=True)
    status_code = Column(Integer, nullable=True)
    message = Column(Text, nullable=False)
    event_metadata = Column(JSON, nullable=True)  # Additional context data
    risk_score = Column(Integer, default=0, nullable=False, index=True)  # 0-100 risk assessment
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User")

    # Indexes for security analysis and monitoring
    __table_args__ = (
        Index('idx_security_events_type', 'event_type'),
        Index('idx_security_events_severity', 'severity'),
        Index('idx_security_events_risk', 'risk_score'),
        Index('idx_security_events_created', 'created_at'),
        Index('idx_security_events_ip_time', 'ip_address', 'created_at'),
        Index('idx_security_events_category_time', 'event_category', 'created_at'),
    )


class AccountLockout(Base):
    """Account lockout tracking for brute force protection"""
    __tablename__ = "account_lockouts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    ip_address = Column(String(45), nullable=False, index=True)
    failed_attempts = Column(Integer, default=0, nullable=False)
    is_locked = Column(Boolean, default=False, nullable=False, index=True)
    locked_until = Column(DateTime(timezone=True), nullable=True, index=True)
    lockout_reason = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User")

    # Indexes
    __table_args__ = (
        Index('idx_account_lockouts_locked', 'is_locked'),
        Index('idx_account_lockouts_expires', 'locked_until'),
    )


class DeviceFingerprint(Base):
    """Device fingerprinting for enhanced security"""
    __tablename__ = "device_fingerprints"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    fingerprint_hash = Column(String(255), nullable=False, unique=True, index=True)
    device_name = Column(String(100), nullable=True)
    browser_name = Column(String(50), nullable=True)
    browser_version = Column(String(20), nullable=True)
    os_name = Column(String(50), nullable=True)
    os_version = Column(String(20), nullable=True)
    screen_resolution = Column(String(20), nullable=True)
    timezone = Column(String(50), nullable=True)
    language = Column(String(10), nullable=True)
    is_trusted = Column(Boolean, default=False, nullable=False)
    is_suspicious = Column(Boolean, default=False, nullable=False)
    first_seen = Column(DateTime(timezone=True), server_default=func.now())
    last_seen = Column(DateTime(timezone=True), server_default=func.now())
    total_logins = Column(Integer, default=1, nullable=False)

    # Relationships
    user = relationship("User")

    # Indexes
    __table_args__ = (
        Index('idx_device_fingerprints_hash', 'fingerprint_hash'),
        Index('idx_device_fingerprints_trusted', 'is_trusted'),
        Index('idx_device_fingerprints_suspicious', 'is_suspicious'),
    )
