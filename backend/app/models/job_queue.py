"""Job queue and dead letter queue models for background processing."""

from sqlalchemy import Column, String, DateTime, Text, Integer, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.models.base import Base
from datetime import datetime
import uuid


class JobQueue(Base):
    """Model for tracking background jobs and their status."""
    __tablename__ = "job_queue"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id = Column(String, nullable=False, unique=True, index=True)
    job_type = Column(String, nullable=False, index=True)
    status = Column(String, nullable=False, default="pending", index=True)  # pending, processing, completed, failed
    priority = Column(Integer, nullable=False, default=0, index=True)
    
    # Job data and metadata
    payload = Column(JSONB, nullable=True)
    result = Column(JSONB, nullable=True)
    error_message = Column(Text, nullable=True)
    
    # Retry tracking
    retry_count = Column(Integer, nullable=False, default=0)
    max_retries = Column(Integer, nullable=False, default=3)
    next_retry_at = Column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), nullable=True)


class DeadLetterQueue(Base):
    """Model for jobs that have exhausted all retry attempts."""
    __tablename__ = "dead_letter_queue"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    original_job_id = Column(String, nullable=False, index=True)
    job_type = Column(String, nullable=False, index=True)
    
    # Original job data
    payload = Column(JSONB, nullable=True)
    final_error = Column(Text, nullable=True)
    retry_count = Column(Integer, nullable=False)
    
    # Timestamps
    failed_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    original_created_at = Column(DateTime(timezone=True), nullable=True)
    
    # Admin fields
    reviewed = Column(Boolean, nullable=False, default=False)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    reviewed_by = Column(String, nullable=True)
    resolution_notes = Column(Text, nullable=True)


class WebhookEvent(Base):
    """Model for tracking webhook events and their processing status."""
    __tablename__ = "webhook_events"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id = Column(String, nullable=False, unique=True, index=True)  # Provider event ID
    provider = Column(String, nullable=False, index=True)  # github, slack, stripe, etc.
    event_type = Column(String, nullable=False, index=True)
    
    # Event data
    payload = Column(JSONB, nullable=False)
    headers = Column(JSONB, nullable=True)
    signature = Column(String, nullable=True)
    
    # Processing status
    status = Column(String, nullable=False, default="pending", index=True)  # pending, processed, failed, duplicate
    processed_at = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(Text, nullable=True)
    
    # Idempotency and retry
    retry_count = Column(Integer, nullable=False, default=0)
    max_retries = Column(Integer, nullable=False, default=3)
    
    # Timestamps
    received_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
