"""OAuth token storage and management models."""

from sqlalchemy import Column, String, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.models.base import Base
from datetime import datetime
import uuid


class OAuthToken(Base):
    """Model for storing OAuth tokens and refresh tokens."""
    __tablename__ = "oauth_tokens"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    provider = Column(String, nullable=False, index=True)  # slack, jira, trello, github
    
    # Token data
    access_token = Column(Text, nullable=False)  # Encrypted at rest
    refresh_token = Column(Text, nullable=True)  # Encrypted at rest
    token_type = Column(String, nullable=False, default="Bearer")
    expires_at = Column(DateTime(timezone=True), nullable=True)
    
    # OAuth scope and metadata
    scopes = Column(JSONB, nullable=True)  # List of granted scopes
    provider_user_id = Column(String, nullable=True, index=True)  # Provider's user ID
    provider_username = Column(String, nullable=True)
    provider_email = Column(String, nullable=True)
    
    # Additional provider-specific data
    oauth_metadata = Column(JSONB, nullable=True)
    
    # Status and timestamps
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=True)
    last_used_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="oauth_tokens")


class OAuthState(Base):
    """Model for tracking OAuth state parameters for CSRF protection."""
    __tablename__ = "oauth_states"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    state = Column(String, nullable=False, unique=True, index=True)
    provider = Column(String, nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Additional data for the OAuth flow
    redirect_uri = Column(String, nullable=True)
    scopes = Column(JSONB, nullable=True)
    flow_metadata = Column(JSONB, nullable=True)
    
    # Expiration and status
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User")


class WebhookSignature(Base):
    """Model for tracking webhook signature verification."""
    __tablename__ = "webhook_signatures"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    provider = Column(String, nullable=False, index=True)
    event_id = Column(String, nullable=False, index=True)
    
    # Signature verification data
    signature = Column(String, nullable=False)
    signature_header = Column(String, nullable=True)  # Header name used for signature
    timestamp = Column(DateTime(timezone=True), nullable=True)
    
    # Verification status
    verified = Column(Boolean, nullable=False, default=False)
    verification_error = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    verified_at = Column(DateTime(timezone=True), nullable=True)
