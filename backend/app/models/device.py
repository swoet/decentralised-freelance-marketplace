"""Device tracking models for session management."""

from sqlalchemy import Column, String, DateTime, Boolean, Text, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.models.base import Base
from datetime import datetime
import uuid


class Device(Base):
    """Model for tracking user devices and their sessions."""
    __tablename__ = "devices"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # Device identification
    device_id = Column(String, nullable=False, unique=True, index=True)  # Generated device fingerprint
    device_name = Column(String, nullable=True)  # User-friendly name
    device_type = Column(String, nullable=True)  # mobile, desktop, tablet
    
    # Browser/Client information
    user_agent = Column(Text, nullable=True)
    browser_name = Column(String, nullable=True)
    browser_version = Column(String, nullable=True)
    os_name = Column(String, nullable=True)
    os_version = Column(String, nullable=True)
    
    # Network information
    ip_address = Column(String, nullable=True)
    country = Column(String, nullable=True)
    city = Column(String, nullable=True)
    
    # Device metadata
    screen_resolution = Column(String, nullable=True)
    timezone = Column(String, nullable=True)
    language = Column(String, nullable=True)
    
    # Security flags
    is_trusted = Column(Boolean, nullable=False, default=False)
    is_blocked = Column(Boolean, nullable=False, default=False)
    
    # Timestamps
    first_seen_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    last_seen_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="devices")
    sessions = relationship("Session", back_populates="device", cascade="all, delete-orphan")


class RefreshToken(Base):
    """Model for managing refresh tokens with rotation."""
    __tablename__ = "refresh_tokens"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=False, index=True)
    device_id = Column(UUID(as_uuid=True), ForeignKey("devices.id"), nullable=True, index=True)
    
    # Token data
    token_hash = Column(String, nullable=False, unique=True, index=True)  # Hashed refresh token
    token_family = Column(String, nullable=False, index=True)  # Token family for rotation detection
    
    # Expiration and status
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)
    is_revoked = Column(Boolean, nullable=False, default=False)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    revoked_reason = Column(String, nullable=True)  # reuse_detected, manual_revoke, etc.
    
    # Usage tracking
    used_at = Column(DateTime(timezone=True), nullable=True)
    replaced_by = Column(UUID(as_uuid=True), ForeignKey("refresh_tokens.id"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User")
    session = relationship("Session", back_populates="refresh_tokens")
    device = relationship("Device")
    replacement_token = relationship("RefreshToken", remote_side=[id])


class SessionActivity(Base):
    """Model for tracking session activity and security events."""
    __tablename__ = "session_activities"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # Activity details
    activity_type = Column(String, nullable=False, index=True)  # login, logout, token_refresh, api_call
    endpoint = Column(String, nullable=True)  # API endpoint accessed
    method = Column(String, nullable=True)  # HTTP method
    status_code = Column(Integer, nullable=True)  # Response status
    
    # Request details
    ip_address = Column(String, nullable=True, index=True)
    user_agent = Column(Text, nullable=True)
    
    # Security flags
    is_suspicious = Column(Boolean, nullable=False, default=False)
    risk_score = Column(Integer, nullable=True)  # 0-100 risk assessment
    
    # Additional metadata
    activity_metadata = Column(JSONB, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False, index=True)
    
    # Relationships
    session = relationship("Session")
    user = relationship("User")
