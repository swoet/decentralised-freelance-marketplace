from sqlalchemy import (
    Column, String, Text, Numeric, DateTime, ForeignKey, Integer, 
    Boolean, JSON, Enum as SQLEnum
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base
from datetime import datetime
import enum
import uuid


class EscrowStatus(enum.Enum):
    """Enhanced escrow status with automation support"""
    DRAFT = "draft"
    ACTIVE = "active"
    MILESTONE_PENDING = "milestone_pending"
    AUTOMATION_PROCESSING = "automation_processing"
    DISPUTE_RAISED = "dispute_raised"
    DISPUTE_RESOLUTION = "dispute_resolution"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    FORCE_RELEASED = "force_released"


class MilestoneType(enum.Enum):
    """Types of milestones with different automation capabilities"""
    MANUAL = "manual"  # Requires manual approval
    TIME_BASED = "time_based"  # Auto-release after time delay
    DELIVERABLE_BASED = "deliverable_based"  # Auto-release on deliverable submission
    APPROVAL_BASED = "approval_based"  # Auto-release on client approval
    CONDITIONAL = "conditional"  # Auto-release based on conditions
    HYBRID = "hybrid"  # Combination of conditions


class MilestoneStatus(enum.Enum):
    """Enhanced milestone status tracking"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    SUBMITTED = "submitted"
    APPROVED = "approved"
    REJECTED = "rejected"
    AUTO_RELEASED = "auto_released"
    DISPUTED = "disputed"
    COMPLETED = "completed"
    EXPIRED = "expired"


class ConditionType(enum.Enum):
    """Types of automated conditions"""
    TIME_DELAY = "time_delay"
    DELIVERABLE_UPLOAD = "deliverable_upload"
    CLIENT_APPROVAL = "client_approval"
    QUALITY_SCORE = "quality_score"
    REPUTATION_THRESHOLD = "reputation_threshold"
    EXTERNAL_API = "external_api"
    ORACLE_VERIFICATION = "oracle_verification"
    MULTI_SIGNATURE = "multi_signature"


class DisputeStatus(enum.Enum):
    """Dispute workflow status"""
    OPEN = "open"
    UNDER_REVIEW = "under_review"
    MEDIATION = "mediation"
    ARBITRATION = "arbitration"
    RESOLVED_CLIENT = "resolved_client"
    RESOLVED_FREELANCER = "resolved_freelancer"
    RESOLVED_SPLIT = "resolved_split"
    ESCALATED = "escalated"
    CLOSED = "closed"


class AutomationEventType(enum.Enum):
    """Types of automation events"""
    CONDITION_MET = "condition_met"
    CONDITION_FAILED = "condition_failed"
    AUTO_RELEASE = "auto_release"
    DISPUTE_AUTO_RAISED = "dispute_auto_raised"
    NOTIFICATION_SENT = "notification_sent"
    EXTERNAL_CALL = "external_call"
    REPUTATION_UPDATE = "reputation_update"


class SmartEscrow(Base):
    """Advanced smart escrow with milestone automation"""
    __tablename__ = "smart_escrows"
    __table_args__ = {'schema': 'marketplace'}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    contract_address = Column(String, nullable=True)  # Blockchain contract
    project_id = Column(UUID(as_uuid=True), ForeignKey("marketplace.projects.id"), nullable=False)
    client_id = Column(UUID(as_uuid=True), ForeignKey("marketplace.users.id"), nullable=False)
    freelancer_id = Column(UUID(as_uuid=True), ForeignKey("marketplace.users.id"), nullable=False)
    
    # Financial details
    total_amount = Column(Numeric(precision=20, scale=8), nullable=False)
    currency_id = Column(UUID(as_uuid=True), ForeignKey("marketplace.currencies.id"), nullable=False)
    released_amount = Column(Numeric(precision=20, scale=8), default=0)
    disputed_amount = Column(Numeric(precision=20, scale=8), default=0)
    
    # Status and automation
    status = Column(SQLEnum(EscrowStatus), default=EscrowStatus.DRAFT)
    is_automated = Column(Boolean, default=True)
    automation_enabled = Column(Boolean, default=True)
    auto_release_delay_hours = Column(Integer, default=72)  # Default 72 hour delay
    
    # Blockchain and payment details
    chain_id = Column(Integer, nullable=True)
    payment_mode = Column(String, default="native")  # 'native' or 'token'
    token_address = Column(String, nullable=True)
    
    # Reputation integration
    reputation_impact_enabled = Column(Boolean, default=True)
    quality_threshold = Column(Numeric(precision=3, scale=2), default=4.0)  # 0-5 scale
    
    # Metadata and configuration
    meta_data = Column(JSON, default=dict)  # Flexible configuration storage
    terms_hash = Column(String, nullable=True)  # Hash of terms and conditions
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=datetime.utcnow, nullable=True)
    activated_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    project = relationship("Project", back_populates="smart_escrow")
    client = relationship("User", foreign_keys=[client_id])
    freelancer = relationship("User", foreign_keys=[freelancer_id])
    currency = relationship("Currency")
    smart_milestones = relationship("SmartMilestone", back_populates="escrow", cascade="all, delete-orphan")
    escrow_disputes = relationship("EscrowDispute", back_populates="escrow", cascade="all, delete-orphan")
    automation_events = relationship("EscrowAutomationEvent", back_populates="escrow", cascade="all, delete-orphan")


class SmartMilestone(Base):
    """Enhanced milestones with automation capabilities"""
    __tablename__ = "smart_milestones"
    __table_args__ = {'schema': 'marketplace'}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    escrow_id = Column(UUID(as_uuid=True), ForeignKey("marketplace.smart_escrows.id"), nullable=False)
    project_id = Column(UUID(as_uuid=True), ForeignKey("marketplace.projects.id"), nullable=False)
    
    # Basic milestone info
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    amount = Column(Numeric(precision=20, scale=8), nullable=False)
    order_index = Column(Integer, nullable=False, default=0)
    
    # Status and type
    status = Column(SQLEnum(MilestoneStatus), default=MilestoneStatus.PENDING)
    milestone_type = Column(SQLEnum(MilestoneType), default=MilestoneType.MANUAL)
    
    # Automation settings
    is_automated = Column(Boolean, default=False)
    auto_release_enabled = Column(Boolean, default=False)
    approval_required = Column(Boolean, default=True)
    
    # Timing and deadlines
    due_date = Column(DateTime(timezone=True), nullable=True)
    auto_release_date = Column(DateTime(timezone=True), nullable=True)
    grace_period_hours = Column(Integer, default=24)
    
    # Deliverables and requirements
    deliverable_requirements = Column(JSON, default=dict)  # File types, counts, etc.
    quality_criteria = Column(JSON, default=dict)  # Quality requirements
    acceptance_criteria = Column(Text, nullable=True)
    
    # Metadata and tracking
    meta_data = Column(JSON, default=dict)
    submission_data = Column(JSON, default=dict)  # Submitted deliverables info
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=datetime.utcnow, nullable=True)
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    released_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    escrow = relationship("SmartEscrow", back_populates="smart_milestones")
    project = relationship("Project", back_populates="smart_milestones")
    automation_conditions = relationship("MilestoneCondition", back_populates="milestone", cascade="all, delete-orphan")
    deliverables = relationship("MilestoneDeliverable", back_populates="milestone", cascade="all, delete-orphan")


class MilestoneCondition(Base):
    """Automated conditions for milestone releases"""
    __tablename__ = "milestone_conditions"
    __table_args__ = {'schema': 'marketplace'}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    milestone_id = Column(UUID(as_uuid=True), ForeignKey("marketplace.smart_milestones.id"), nullable=False)
    
    # Condition details
    condition_type = Column(SQLEnum(ConditionType), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    
    # Configuration
    config = Column(JSON, default=dict)  # Type-specific configuration
    is_required = Column(Boolean, default=True)  # If False, it's optional
    weight = Column(Numeric(precision=3, scale=2), default=1.0)  # For weighted conditions
    
    # Status tracking
    is_met = Column(Boolean, default=False)
    evaluation_result = Column(JSON, default=dict)  # Detailed evaluation data
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=datetime.utcnow, nullable=True)
    evaluated_at = Column(DateTime(timezone=True), nullable=True)
    met_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    milestone = relationship("SmartMilestone", back_populates="automation_conditions")


class MilestoneDeliverable(Base):
    """Deliverables submitted for milestones"""
    __tablename__ = "milestone_deliverables"
    __table_args__ = {'schema': 'marketplace'}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    milestone_id = Column(UUID(as_uuid=True), ForeignKey("marketplace.smart_milestones.id"), nullable=False)
    
    # Deliverable info
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    file_url = Column(String, nullable=True)  # File storage URL
    file_type = Column(String, nullable=True)
    file_size = Column(Integer, nullable=True)
    file_hash = Column(String, nullable=True)  # For integrity verification
    
    # Status and approval
    is_approved = Column(Boolean, default=False)
    approval_notes = Column(Text, nullable=True)
    quality_score = Column(Numeric(precision=3, scale=2), nullable=True)  # 0-5 rating
    
    # Metadata
    meta_data = Column(JSON, default=dict)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=datetime.utcnow, nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    milestone = relationship("SmartMilestone", back_populates="deliverables")


class EscrowDispute(Base):
    """Dispute management for smart escrows"""
    __tablename__ = "escrow_disputes"
    __table_args__ = {'schema': 'marketplace'}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    escrow_id = Column(UUID(as_uuid=True), ForeignKey("marketplace.smart_escrows.id"), nullable=False)
    milestone_id = Column(UUID(as_uuid=True), ForeignKey("marketplace.smart_milestones.id"), nullable=True)
    
    # Dispute details
    raised_by = Column(UUID(as_uuid=True), ForeignKey("marketplace.users.id"), nullable=False)
    dispute_type = Column(String, nullable=False)  # 'quality', 'deadline', 'scope', etc.
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    disputed_amount = Column(Numeric(precision=20, scale=8), nullable=False)
    
    # Status and resolution
    status = Column(SQLEnum(DisputeStatus), default=DisputeStatus.OPEN)
    priority = Column(String, default="medium")  # 'low', 'medium', 'high', 'urgent'
    resolution = Column(Text, nullable=True)
    resolution_amount_client = Column(Numeric(precision=20, scale=8), default=0)
    resolution_amount_freelancer = Column(Numeric(precision=20, scale=8), default=0)
    
    # Assignment and handling
    assigned_mediator_id = Column(UUID(as_uuid=True), ForeignKey("marketplace.users.id"), nullable=True)
    assigned_arbitrator_id = Column(UUID(as_uuid=True), ForeignKey("marketplace.users.id"), nullable=True)
    
    # Evidence and documentation
    evidence_urls = Column(JSON, default=list)  # URLs to evidence files
    communications_log = Column(JSON, default=list)  # Discussion history
    
    # Deadlines and timing
    response_deadline = Column(DateTime(timezone=True), nullable=True)
    resolution_deadline = Column(DateTime(timezone=True), nullable=True)
    auto_escalate_at = Column(DateTime(timezone=True), nullable=True)
    
    # Metadata
    meta_data = Column(JSON, default=dict)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=datetime.utcnow, nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    closed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    escrow = relationship("SmartEscrow", back_populates="escrow_disputes")
    milestone = relationship("SmartMilestone")
    raised_by_user = relationship("User", foreign_keys=[raised_by])
    mediator = relationship("User", foreign_keys=[assigned_mediator_id])
    arbitrator = relationship("User", foreign_keys=[assigned_arbitrator_id])


class EscrowAutomationEvent(Base):
    """Event log for escrow automation activities"""
    __tablename__ = "escrow_automation_events"
    __table_args__ = {'schema': 'marketplace'}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    escrow_id = Column(UUID(as_uuid=True), ForeignKey("marketplace.smart_escrows.id"), nullable=False)
    milestone_id = Column(UUID(as_uuid=True), ForeignKey("marketplace.smart_milestones.id"), nullable=True)
    
    # Event details
    event_type = Column(SQLEnum(AutomationEventType), nullable=False)
    event_name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    
    # Event data and results
    event_data = Column(JSON, default=dict)  # Input data for the event
    result_data = Column(JSON, default=dict)  # Output/result data
    success = Column(Boolean, default=True)
    error_message = Column(Text, nullable=True)
    
    # Processing info
    triggered_by = Column(String, nullable=True)  # 'system', 'user', 'external', etc.
    processed_by = Column(String, nullable=True)  # Service/component that processed
    execution_time_ms = Column(Integer, nullable=True)
    
    # Metadata
    meta_data = Column(JSON, default=dict)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    processed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    escrow = relationship("SmartEscrow", back_populates="automation_events")
    milestone = relationship("SmartMilestone")
