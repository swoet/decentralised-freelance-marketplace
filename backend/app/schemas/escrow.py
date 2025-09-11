"""Smart Escrow schemas with comprehensive automation support."""

from pydantic import BaseModel, Field, validator
from typing import List, Optional, Union, Dict, Any
from uuid import UUID
from decimal import Decimal
from datetime import datetime
from enum import Enum


# Enums matching the database models
class EscrowStatus(str, Enum):
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


class MilestoneType(str, Enum):
    """Types of milestones with different automation capabilities"""
    MANUAL = "manual"
    TIME_BASED = "time_based"
    DELIVERABLE_BASED = "deliverable_based"
    APPROVAL_BASED = "approval_based"
    CONDITIONAL = "conditional"
    HYBRID = "hybrid"


class MilestoneStatus(str, Enum):
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


class ConditionType(str, Enum):
    """Types of automated conditions"""
    TIME_DELAY = "time_delay"
    DELIVERABLE_UPLOAD = "deliverable_upload"
    CLIENT_APPROVAL = "client_approval"
    QUALITY_SCORE = "quality_score"
    REPUTATION_THRESHOLD = "reputation_threshold"
    EXTERNAL_API = "external_api"
    ORACLE_VERIFICATION = "oracle_verification"
    MULTI_SIGNATURE = "multi_signature"


class DisputeStatus(str, Enum):
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


class AutomationEventType(str, Enum):
    """Types of automation events"""
    CONDITION_MET = "condition_met"
    CONDITION_FAILED = "condition_failed"
    AUTO_RELEASE = "auto_release"
    DISPUTE_AUTO_RAISED = "dispute_auto_raised"
    NOTIFICATION_SENT = "notification_sent"
    EXTERNAL_CALL = "external_call"
    REPUTATION_UPDATE = "reputation_update"


# === SMART ESCROW SCHEMAS ===

class SmartEscrowBase(BaseModel):
    """Base schema for smart escrow"""
    project_id: UUID
    client_id: UUID
    freelancer_id: UUID
    total_amount: Decimal = Field(..., gt=0, description="Total escrow amount")
    currency_id: UUID
    is_automated: bool = True
    automation_enabled: bool = True
    auto_release_delay_hours: int = Field(default=72, ge=1, le=8760)  # 1 hour to 1 year
    chain_id: Optional[int] = None
    payment_mode: str = Field(default="native", pattern="^(native|token)$")
    token_address: Optional[str] = None
    reputation_impact_enabled: bool = True
    quality_threshold: Decimal = Field(default=Decimal("4.0"), ge=0, le=5)
    meta_data: Optional[Dict[str, Any]] = Field(default_factory=dict)
    terms_hash: Optional[str] = None

    @validator('token_address')
    def validate_token_address(cls, v, values):
        if values.get('payment_mode') == 'token' and not v:
            raise ValueError('Token address is required when payment_mode is token')
        return v


class SmartEscrowCreate(SmartEscrowBase):
    """Schema for creating a smart escrow"""
    pass


class SmartEscrowUpdate(BaseModel):
    """Schema for updating a smart escrow"""
    status: Optional[EscrowStatus] = None
    contract_address: Optional[str] = None
    automation_enabled: Optional[bool] = None
    auto_release_delay_hours: Optional[int] = Field(None, ge=1, le=8760)
    quality_threshold: Optional[Decimal] = Field(None, ge=0, le=5)
    meta_data: Optional[Dict[str, Any]] = None
    terms_hash: Optional[str] = None


class SmartEscrowResponse(SmartEscrowBase):
    """Complete smart escrow response"""
    id: UUID
    contract_address: Optional[str] = None
    status: EscrowStatus
    released_amount: Decimal
    disputed_amount: Decimal
    created_at: datetime
    updated_at: Optional[datetime] = None
    activated_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    # Optional nested data
    project_title: Optional[str] = None
    client_name: Optional[str] = None
    freelancer_name: Optional[str] = None
    currency_symbol: Optional[str] = None
    milestone_count: Optional[int] = None
    completed_milestones: Optional[int] = None

    class Config:
        from_attributes = True


# === MILESTONE SCHEMAS ===

class SmartMilestoneBase(BaseModel):
    """Base schema for smart milestones"""
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10, max_length=2000)
    amount: Decimal = Field(..., gt=0)
    order_index: int = Field(..., ge=0)
    milestone_type: MilestoneType = MilestoneType.MANUAL
    is_automated: bool = False
    auto_release_enabled: bool = False
    approval_required: bool = True
    due_date: Optional[datetime] = None
    auto_release_date: Optional[datetime] = None
    grace_period_hours: int = Field(default=24, ge=0, le=168)  # 0 to 1 week
    deliverable_requirements: Optional[Dict[str, Any]] = Field(default_factory=dict)
    quality_criteria: Optional[Dict[str, Any]] = Field(default_factory=dict)
    acceptance_criteria: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)


class SmartMilestoneCreate(SmartMilestoneBase):
    """Schema for creating a smart milestone"""
    escrow_id: UUID
    project_id: UUID


class SmartMilestoneUpdate(BaseModel):
    """Schema for updating a smart milestone"""
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    description: Optional[str] = Field(None, min_length=10, max_length=2000)
    status: Optional[MilestoneStatus] = None
    milestone_type: Optional[MilestoneType] = None
    auto_release_enabled: Optional[bool] = None
    approval_required: Optional[bool] = None
    due_date: Optional[datetime] = None
    auto_release_date: Optional[datetime] = None
    grace_period_hours: Optional[int] = Field(None, ge=0, le=168)
    deliverable_requirements: Optional[Dict[str, Any]] = None
    quality_criteria: Optional[Dict[str, Any]] = None
    acceptance_criteria: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    submission_data: Optional[Dict[str, Any]] = None


class SmartMilestoneResponse(SmartMilestoneBase):
    """Complete smart milestone response"""
    id: UUID
    escrow_id: UUID
    project_id: UUID
    status: MilestoneStatus
    submission_data: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    submitted_at: Optional[datetime] = None
    approved_at: Optional[datetime] = None
    released_at: Optional[datetime] = None
    
    # Optional nested data
    condition_count: Optional[int] = None
    deliverable_count: Optional[int] = None
    conditions_met: Optional[int] = None

    class Config:
        from_attributes = True


# === MILESTONE CONDITION SCHEMAS ===

class MilestoneConditionBase(BaseModel):
    """Base schema for milestone conditions"""
    condition_type: ConditionType
    name: str = Field(..., min_length=3, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    config: Dict[str, Any] = Field(default_factory=dict)
    is_required: bool = True
    weight: Decimal = Field(default=Decimal("1.0"), ge=0, le=10)


class MilestoneConditionCreate(MilestoneConditionBase):
    """Schema for creating a milestone condition"""
    milestone_id: UUID


class MilestoneConditionUpdate(BaseModel):
    """Schema for updating a milestone condition"""
    name: Optional[str] = Field(None, min_length=3, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    config: Optional[Dict[str, Any]] = None
    is_required: Optional[bool] = None
    weight: Optional[Decimal] = Field(None, ge=0, le=10)
    is_met: Optional[bool] = None
    evaluation_result: Optional[Dict[str, Any]] = None


class MilestoneConditionResponse(MilestoneConditionBase):
    """Complete milestone condition response"""
    id: UUID
    milestone_id: UUID
    is_met: bool
    evaluation_result: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    evaluated_at: Optional[datetime] = None
    met_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# === MILESTONE DELIVERABLE SCHEMAS ===

class MilestoneDeliverableBase(BaseModel):
    """Base schema for milestone deliverables"""
    name: str = Field(..., min_length=3, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    file_url: Optional[str] = None
    file_type: Optional[str] = None
    file_size: Optional[int] = Field(None, gt=0)
    file_hash: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)


class MilestoneDeliverableCreate(MilestoneDeliverableBase):
    """Schema for creating a milestone deliverable"""
    milestone_id: UUID


class MilestoneDeliverableUpdate(BaseModel):
    """Schema for updating a milestone deliverable"""
    name: Optional[str] = Field(None, min_length=3, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    file_url: Optional[str] = None
    file_type: Optional[str] = None
    file_size: Optional[int] = Field(None, gt=0)
    file_hash: Optional[str] = None
    is_approved: Optional[bool] = None
    approval_notes: Optional[str] = Field(None, max_length=1000)
    quality_score: Optional[Decimal] = Field(None, ge=0, le=5)
    metadata: Optional[Dict[str, Any]] = None


class MilestoneDeliverableResponse(MilestoneDeliverableBase):
    """Complete milestone deliverable response"""
    id: UUID
    milestone_id: UUID
    is_approved: bool
    approval_notes: Optional[str] = None
    quality_score: Optional[Decimal] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    approved_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# === DISPUTE SCHEMAS ===

class EscrowDisputeBase(BaseModel):
    """Base schema for escrow disputes"""
    dispute_type: str = Field(..., min_length=3, max_length=50)
    title: str = Field(..., min_length=5, max_length=200)
    description: str = Field(..., min_length=20, max_length=2000)
    disputed_amount: Decimal = Field(..., gt=0)
    priority: str = Field(default="medium", pattern="^(low|medium|high|urgent)$")
    evidence_urls: Optional[List[str]] = Field(default_factory=list)
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)


class EscrowDisputeCreate(EscrowDisputeBase):
    """Schema for creating an escrow dispute"""
    escrow_id: UUID
    milestone_id: Optional[UUID] = None
    raised_by: UUID


class EscrowDisputeUpdate(BaseModel):
    """Schema for updating an escrow dispute"""
    status: Optional[DisputeStatus] = None
    priority: Optional[str] = Field(None, pattern="^(low|medium|high|urgent)$")
    resolution: Optional[str] = Field(None, max_length=2000)
    resolution_amount_client: Optional[Decimal] = Field(None, ge=0)
    resolution_amount_freelancer: Optional[Decimal] = Field(None, ge=0)
    assigned_mediator_id: Optional[UUID] = None
    assigned_arbitrator_id: Optional[UUID] = None
    evidence_urls: Optional[List[str]] = None
    communications_log: Optional[List[Dict[str, Any]]] = None
    response_deadline: Optional[datetime] = None
    resolution_deadline: Optional[datetime] = None
    auto_escalate_at: Optional[datetime] = None
    metadata: Optional[Dict[str, Any]] = None


class EscrowDisputeResponse(EscrowDisputeBase):
    """Complete escrow dispute response"""
    id: UUID
    escrow_id: UUID
    milestone_id: Optional[UUID] = None
    raised_by: UUID
    status: DisputeStatus
    resolution: Optional[str] = None
    resolution_amount_client: Decimal
    resolution_amount_freelancer: Decimal
    assigned_mediator_id: Optional[UUID] = None
    assigned_arbitrator_id: Optional[UUID] = None
    communications_log: Optional[List[Dict[str, Any]]] = None
    response_deadline: Optional[datetime] = None
    resolution_deadline: Optional[datetime] = None
    auto_escalate_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    
    # Optional nested data
    raised_by_name: Optional[str] = None
    mediator_name: Optional[str] = None
    arbitrator_name: Optional[str] = None
    escrow_title: Optional[str] = None
    milestone_title: Optional[str] = None

    class Config:
        from_attributes = True


# === AUTOMATION EVENT SCHEMAS ===

class EscrowAutomationEventBase(BaseModel):
    """Base schema for escrow automation events"""
    event_type: AutomationEventType
    event_name: str = Field(..., min_length=3, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    event_data: Optional[Dict[str, Any]] = Field(default_factory=dict)
    result_data: Optional[Dict[str, Any]] = Field(default_factory=dict)
    success: bool = True
    error_message: Optional[str] = None
    triggered_by: Optional[str] = None
    processed_by: Optional[str] = None
    execution_time_ms: Optional[int] = Field(None, ge=0)
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)


class EscrowAutomationEventCreate(EscrowAutomationEventBase):
    """Schema for creating an escrow automation event"""
    escrow_id: UUID
    milestone_id: Optional[UUID] = None


class EscrowAutomationEventResponse(EscrowAutomationEventBase):
    """Complete escrow automation event response"""
    id: UUID
    escrow_id: UUID
    milestone_id: Optional[UUID] = None
    created_at: datetime
    processed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# === LIST AND FILTER SCHEMAS ===

class SmartEscrowFilter(BaseModel):
    """Schema for filtering smart escrows"""
    project_id: Optional[UUID] = None
    client_id: Optional[UUID] = None
    freelancer_id: Optional[UUID] = None
    status: Optional[Union[EscrowStatus, List[EscrowStatus]]] = None
    is_automated: Optional[bool] = None
    automation_enabled: Optional[bool] = None
    chain_id: Optional[int] = None
    payment_mode: Optional[str] = None
    created_after: Optional[datetime] = None
    created_before: Optional[datetime] = None


class SmartEscrowListResponse(BaseModel):
    """Paginated response for smart escrow listings"""
    escrows: List[SmartEscrowResponse]
    total_count: int
    page: int
    page_size: int
    has_next: bool
    has_prev: bool


class SmartMilestoneFilter(BaseModel):
    """Schema for filtering smart milestones"""
    escrow_id: Optional[UUID] = None
    project_id: Optional[UUID] = None
    status: Optional[Union[MilestoneStatus, List[MilestoneStatus]]] = None
    milestone_type: Optional[MilestoneType] = None
    is_automated: Optional[bool] = None
    auto_release_enabled: Optional[bool] = None
    due_before: Optional[datetime] = None
    due_after: Optional[datetime] = None


class SmartMilestoneListResponse(BaseModel):
    """Paginated response for smart milestone listings"""
    milestones: List[SmartMilestoneResponse]
    total_count: int
    page: int
    page_size: int
    has_next: bool
    has_prev: bool


# === ACTION SCHEMAS ===

class MilestoneSubmissionSchema(BaseModel):
    """Schema for milestone submission"""
    submission_notes: Optional[str] = Field(None, max_length=1000)
    deliverable_urls: Optional[List[str]] = Field(default_factory=list)
    submission_data: Optional[Dict[str, Any]] = Field(default_factory=dict)


class MilestoneApprovalSchema(BaseModel):
    """Schema for milestone approval/rejection"""
    approved: bool
    feedback: Optional[str] = Field(None, max_length=1000)
    quality_score: Optional[Decimal] = Field(None, ge=0, le=5)
    conditions_override: Optional[Dict[str, bool]] = Field(default_factory=dict)


class EscrowReleaseSchema(BaseModel):
    """Schema for escrow fund release"""
    milestone_ids: Optional[List[UUID]] = Field(default_factory=list)
    release_amount: Optional[Decimal] = Field(None, gt=0)
    release_notes: Optional[str] = Field(None, max_length=500)
    force_release: bool = False
    bypass_conditions: bool = False


# === LEGACY COMPATIBILITY SCHEMAS ===

class EscrowContractBase(BaseModel):
    """Legacy base schema - kept for backward compatibility"""
    client: str
    freelancer: str
    milestone_descriptions: List[str]
    milestone_amounts: List[int]


class EscrowContractCreate(BaseModel):
    """Legacy create schema - kept for backward compatibility"""
    project_id: UUID
    client_id: UUID
    freelancer_id: UUID
    total_amount: Decimal
    payment_mode: Optional[str] = Field(default='native', description="'native' or 'token'")
    chain_id: Optional[int] = None
    token_address: Optional[str] = None


class EscrowContractUpdate(BaseModel):
    """Legacy update schema - kept for backward compatibility"""
    status: Optional[str] = None


class EscrowContractFilter(BaseModel):
    """Legacy filter schema - kept for backward compatibility"""
    project_id: Optional[UUID] = None
    client_id: Optional[UUID] = None
    freelancer_id: Optional[UUID] = None
    chain_id: Optional[int] = None
    status: Optional[Union[str, List[str]]] = None
    payment_mode: Optional[str] = None


class EscrowContractResponse(BaseModel):
    """Legacy response schema - kept for backward compatibility"""
    id: UUID
    contract_address: str
    project_id: UUID
    client_id: UUID
    freelancer_id: UUID
    total_amount: Decimal
    status: str
    payment_mode: Optional[str] = None
    chain_id: Optional[int] = None
    token_address: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Optional nested data
    project_title: Optional[str] = None
    client_name: Optional[str] = None
    freelancer_name: Optional[str] = None
    milestone_count: Optional[int] = None
    remaining_amount: Optional[Decimal] = None

    class Config:
        from_attributes = True


class EscrowListResponse(BaseModel):
    """Legacy list response schema - kept for backward compatibility"""
    contracts: List[EscrowContractResponse]
    total_count: int
    page: int
    page_size: int
    has_next: bool
    has_prev: bool


class EscrowContract(EscrowContractBase):
    """Legacy contract schema - kept for backward compatibility"""
    contract_address: str
    status: str

    class Config:
        from_attributes = True


class EscrowCreate(BaseModel):
    """Legacy create schema - kept for backward compatibility"""
    project_id: str
    amount: float
    description: str


class EscrowResponse(BaseModel):
    """Legacy response schema - kept for backward compatibility"""
    id: str
    project_id: str
    amount: float
    description: str
    status: str
