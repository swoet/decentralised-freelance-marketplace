from __future__ import annotations
from sqlalchemy import Column, String, Boolean, ForeignKey, Integer, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from .base import Base


class Integration(Base):
    __tablename__ = "integrations"

    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=True, index=True)
    provider = Column(String, nullable=False, index=True)  # slack, github, jira, etc.
    status = Column(String, nullable=False, default="connected")
    config_json = Column(JSONB, nullable=True)


class Webhook(Base):
    __tablename__ = "webhooks"

    integration_id = Column(UUID(as_uuid=True), ForeignKey("integrations.id", ondelete="CASCADE"), nullable=False, index=True)
    url = Column(String, nullable=False)
    secret = Column(String, nullable=True)
    events = Column(JSONB, nullable=True)  # list of event types


class ApiKey(Base):
    __tablename__ = "api_keys"

    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    prefix = Column(String, nullable=False, unique=True, index=True)
    hash = Column(String, nullable=False)
    scopes = Column(JSONB, nullable=True)
    revoked = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    last_used_at = Column(DateTime(timezone=True), nullable=True)


class ApiKeyUsage(Base):
    __tablename__ = "api_key_usages"

    key_id = Column(UUID(as_uuid=True), ForeignKey("api_keys.id", ondelete="CASCADE"), nullable=False, index=True)
    route = Column(String, nullable=False)
    status_code = Column(Integer, nullable=False)
    latency_ms = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)


class IntegrationRequest(Base):
    __tablename__ = "integration_requests"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    integration_name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    use_case = Column(String, nullable=True)
    priority = Column(String, nullable=False, default="medium")  # low, medium, high
    status = Column(String, nullable=False, default="pending")  # pending, reviewing, approved, rejected, implemented
    upvotes = Column(Integer, nullable=False, default=0)
    admin_notes = Column(String, nullable=True)
