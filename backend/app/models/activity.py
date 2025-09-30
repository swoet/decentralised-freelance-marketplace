"""
Activity tracking models for admin dashboard
"""
from sqlalchemy import Column, String, Integer, DateTime, Float, JSON, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import Base
import uuid


class ActivityLog(Base):
    """Track user activities for admin dashboard"""
    __tablename__ = "activity_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    activity_type = Column(String, nullable=False)  # user_signup, project_created, payment_completed, etc.
    description = Column(String, nullable=False)
    extra_data = Column(JSON, nullable=True)  # Additional context (renamed from metadata to avoid SQLAlchemy conflict)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    
    # Relationship to user
    user = relationship("User", back_populates="activities")


class SystemMetrics(Base):
    """Store system-level metrics for dashboard"""
    __tablename__ = "system_metrics"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    metric_name = Column(String, nullable=False)  # ai_requests, blockchain_txns, api_calls
    metric_value = Column(Float, nullable=False)
    recorded_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    extra_data = Column(JSON, nullable=True)


class RevenueRecord(Base):
    """Track revenue from platform fees and transactions"""
    __tablename__ = "revenue_records"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=True)
    client_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    freelancer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    amount = Column(Float, nullable=False)  # Platform fee amount
    currency = Column(String, default="USD", nullable=False)
    transaction_type = Column(String, nullable=False)  # platform_fee, subscription, premium_listing
    payment_method = Column(String, nullable=True)  # stripe, blockchain, escrow
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    extra_data = Column(JSON, nullable=True)
    
    # Relationships
    project = relationship("Project", foreign_keys=[project_id])
    client = relationship("User", foreign_keys=[client_id])
    freelancer = relationship("User", foreign_keys=[freelancer_id])


class AIRequestLog(Base):
    """Track AI/ML API requests for analytics"""
    __tablename__ = "ai_request_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    request_type = Column(String, nullable=False)  # matching, content_gen, skill_analysis
    endpoint = Column(String, nullable=False)
    
    tokens_used = Column(Integer, default=0)
    latency_ms = Column(Integer, nullable=True)
    success = Column(Boolean, default=True)
    error_message = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    extra_data = Column(JSON, nullable=True)
    
    # Relationship
    user = relationship("User", back_populates="ai_requests")


class DisputeCase(Base):
    """Track disputes for admin management"""
    __tablename__ = "dispute_cases"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    raised_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    against_user = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    status = Column(String, default="pending", nullable=False)  # pending, investigating, resolved, closed
    priority = Column(String, default="medium", nullable=False)  # low, medium, high, critical
    category = Column(String, nullable=False)  # payment, quality, communication, deadline
    
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    evidence = Column(JSON, nullable=True)  # URLs, screenshots, messages
    
    resolution = Column(String, nullable=True)
    resolved_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    project = relationship("Project", foreign_keys=[project_id])
    plaintiff = relationship("User", foreign_keys=[raised_by])
    defendant = relationship("User", foreign_keys=[against_user])
    resolver = relationship("User", foreign_keys=[resolved_by])
