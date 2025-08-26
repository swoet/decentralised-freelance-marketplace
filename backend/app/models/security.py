from __future__ import annotations
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid

from .base import Base


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
