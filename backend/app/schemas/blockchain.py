"""
Pydantic schemas for blockchain operations
"""

from datetime import datetime
from decimal import Decimal
from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field, validator
from enum import Enum


class EscrowState(str, Enum):
    """Escrow states from smart contract"""
    CREATED = "Created"
    ACTIVE = "Active"
    DISPUTED = "Disputed"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"
    REFUNDED = "Refunded"


class MilestoneState(str, Enum):
    """Milestone states from smart contract"""
    PENDING = "Pending"
    SUBMITTED = "Submitted"
    APPROVED = "Approved"
    REJECTED = "Rejected"
    RELEASED = "Released"
    DISPUTED = "Disputed"


class DisputeState(str, Enum):
    """Dispute states from smart contract"""
    NONE = "None"
    RAISED = "Raised"
    UNDER_REVIEW = "UnderReview"
    RESOLVED = "Resolved"
    ESCALATED = "Escalated"


class MilestoneCreateRequest(BaseModel):
    """Schema for creating a milestone"""
    amount: Decimal = Field(..., gt=0, description="Amount for this milestone")
    description: str = Field(..., min_length=1, max_length=500, description="Milestone description")
    due_date: datetime = Field(..., description="Due date for milestone completion")
    auto_release: bool = Field(default=False, description="Enable auto-release after delay")
    auto_release_delay: int = Field(default=86400, description="Auto-release delay in seconds")
    
    @validator('due_date')
    def due_date_must_be_future(cls, v):
        if v <= datetime.now():
            raise ValueError('Due date must be in the future')
        return v
    
    @validator('auto_release_delay')
    def validate_auto_release_delay(cls, v, values):
        if values.get('auto_release') and v < 3600:  # Minimum 1 hour
            raise ValueError('Auto-release delay must be at least 1 hour')
        if v > 2592000:  # Maximum 30 days
            raise ValueError('Auto-release delay cannot exceed 30 days')
        return v


class EscrowCreateRequest(BaseModel):
    """Schema for creating an escrow"""
    milestones: List[MilestoneCreateRequest] = Field(..., min_items=1, max_items=20)
    payment_token: str = Field(default="0x0000000000000000000000000000000000000000", description="Token contract address, 0x0 for ETH")
    platform_fee_percent: int = Field(default=250, ge=0, le=1000, description="Platform fee in basis points (250 = 2.5%)")
    gas_price_gwei: Optional[int] = Field(default=20, ge=1, le=1000, description="Gas price in Gwei")
    
    @validator('payment_token')
    def validate_payment_token(cls, v):
        if v != "0x0000000000000000000000000000000000000000":
            if not v.startswith('0x') or len(v) != 42:
                raise ValueError('Invalid token address format')
        return v


class MilestoneData(BaseModel):
    """Schema for milestone data"""
    amount: Decimal
    description: str
    due_date: datetime
    state: MilestoneState
    deliverable_hash: Optional[str] = None
    submitted_at: Optional[datetime] = None
    approved_at: Optional[datetime] = None
    feedback: Optional[str] = None


class DisputeData(BaseModel):
    """Schema for dispute data"""
    state: DisputeState
    initiator: Optional[str] = None
    reason: Optional[str] = None
    created_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    resolver: Optional[str] = None
    resolution: Optional[str] = None


class EscrowData(BaseModel):
    """Schema for complete escrow data"""
    escrow_id: int
    project_id: int
    client: str
    freelancer: str
    payment_token: str
    total_amount: Decimal
    state: EscrowState
    created_at: datetime
    completed_at: Optional[datetime] = None
    milestones: List[MilestoneData]
    dispute: DisputeData


class BlockchainTransactionResult(BaseModel):
    """Schema for blockchain transaction results"""
    success: bool
    transaction_hash: Optional[str] = None
    gas_estimate: Optional[int] = None
    unsigned_transaction: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    message: Optional[str] = None


class MilestoneSubmissionRequest(BaseModel):
    """Schema for milestone submission"""
    deliverable_hash: str = Field(..., min_length=1, description="IPFS hash of deliverable")
    notes: Optional[str] = Field(default="", max_length=1000, description="Additional submission notes")


class MilestoneApprovalRequest(BaseModel):
    """Schema for milestone approval"""
    feedback: str = Field(..., max_length=1000, description="Feedback for freelancer")
    rating: Optional[int] = Field(default=None, ge=1, le=5, description="Optional rating for milestone")


class MilestoneRejectionRequest(BaseModel):
    """Schema for milestone rejection"""
    feedback: str = Field(..., min_length=10, max_length=1000, description="Detailed rejection feedback")
    requested_changes: List[str] = Field(default=[], description="List of requested changes")


class DisputeCreateRequest(BaseModel):
    """Schema for creating a dispute"""
    reason: str = Field(..., min_length=20, max_length=1000, description="Detailed reason for dispute")
    affected_milestones: List[int] = Field(default=[], description="Milestone indices affected by dispute")
    evidence: List[str] = Field(default=[], description="IPFS hashes of evidence")


class DisputeResolutionRequest(BaseModel):
    """Schema for dispute resolution (arbitrator only)"""
    resolution: str = Field(..., min_length=10, max_length=2000, description="Resolution details")
    refund_amounts: List[Decimal] = Field(default=[], description="Refund amounts per milestone")
    release_amounts: List[Decimal] = Field(default=[], description="Release amounts per milestone")


class EscrowSummary(BaseModel):
    """Schema for escrow summary"""
    escrow_id: int
    project_id: int
    project_title: Optional[str] = None
    client_name: Optional[str] = None
    freelancer_name: Optional[str] = None
    total_amount: Decimal
    state: EscrowState
    milestones_completed: int
    milestones_total: int
    created_at: datetime
    last_activity: Optional[datetime] = None


class EscrowListResponse(BaseModel):
    """Schema for escrow list response"""
    escrows: List[EscrowSummary]
    total_count: int
    page: int
    per_page: int
    has_next: bool
    has_prev: bool


class TransactionStatusResponse(BaseModel):
    """Schema for transaction status response"""
    transaction_hash: str
    status: str  # pending, success, failed, error
    block_number: Optional[int] = None
    gas_used: Optional[int] = None
    confirmations: Optional[int] = None
    logs: Optional[List[Dict[str, Any]]] = None
    error: Optional[str] = None
    message: Optional[str] = None


class GasEstimateRequest(BaseModel):
    """Schema for gas estimation request"""
    operation_type: str = Field(..., description="Type of operation: create_escrow, submit_milestone, etc.")
    escrow_data: Optional[EscrowCreateRequest] = None
    escrow_id: Optional[int] = None
    milestone_index: Optional[int] = None


class GasEstimateResponse(BaseModel):
    """Schema for gas estimation response"""
    gas_estimate: int
    gas_price_gwei: int
    estimated_cost_eth: Decimal
    estimated_cost_usd: Optional[Decimal] = None


class WalletConnectionRequest(BaseModel):
    """Schema for wallet connection verification"""
    address: str = Field(..., description="Wallet address")
    signature: str = Field(..., description="Signed message")
    message: str = Field(..., description="Original message that was signed")
    
    @validator('address')
    def validate_address(cls, v):
        if not v.startswith('0x') or len(v) != 42:
            raise ValueError('Invalid wallet address format')
        return v.lower()


class WalletConnectionResponse(BaseModel):
    """Schema for wallet connection response"""
    verified: bool
    address: str
    message: Optional[str] = None


class NetworkStatus(BaseModel):
    """Schema for blockchain network status"""
    network: str
    connected: bool
    block_number: Optional[int] = None
    gas_price: Optional[int] = None
    contract_address: Optional[str] = None


class PaymentTokenInfo(BaseModel):
    """Schema for payment token information"""
    address: str
    name: str
    symbol: str
    decimals: int
    balance: Optional[Decimal] = None


class UserBlockchainProfile(BaseModel):
    """Schema for user blockchain profile"""
    wallet_address: Optional[str] = None
    is_verified: bool = False
    active_escrows: int = 0
    completed_escrows: int = 0
    total_earned: Decimal = Decimal('0')
    total_paid: Decimal = Decimal('0')
    reputation_score: Optional[Decimal] = None
    supported_tokens: List[PaymentTokenInfo] = []


class AutoReleaseSettings(BaseModel):
    """Schema for auto-release settings"""
    enabled: bool = False
    delay_hours: int = Field(default=24, ge=1, le=720)  # 1 hour to 30 days
    conditions: List[str] = Field(default=[])


class EscrowFilters(BaseModel):
    """Schema for escrow filtering"""
    state: Optional[EscrowState] = None
    payment_token: Optional[str] = None
    min_amount: Optional[Decimal] = None
    max_amount: Optional[Decimal] = None
    has_disputes: Optional[bool] = None
    created_after: Optional[datetime] = None
    created_before: Optional[datetime] = None


class BlockchainSettings(BaseModel):
    """Schema for blockchain settings"""
    network: str
    rpc_url: str
    contract_address: str
    default_gas_price: int = 20
    confirmation_blocks: int = 12
    auto_retry_failed: bool = True
    max_retry_attempts: int = 3


class EscrowMetrics(BaseModel):
    """Schema for escrow metrics"""
    total_escrows: int = 0
    active_escrows: int = 0
    completed_escrows: int = 0
    disputed_escrows: int = 0
    total_volume: Decimal = Decimal('0')
    average_completion_time: Optional[int] = None  # in hours
    dispute_rate: Decimal = Decimal('0')
    success_rate: Decimal = Decimal('0')


class EventLog(BaseModel):
    """Schema for blockchain event logs"""
    event_name: str
    transaction_hash: str
    block_number: int
    timestamp: datetime
    args: Dict[str, Any]
    escrow_id: Optional[int] = None


class EventLogResponse(BaseModel):
    """Schema for event log response"""
    events: List[EventLog]
    total_count: int
    page: int
    per_page: int
