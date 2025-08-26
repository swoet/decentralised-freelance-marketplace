"""Escrow contract schemas."""

from pydantic import BaseModel, Field
from typing import List, Optional, Union
from uuid import UUID
from decimal import Decimal
from datetime import datetime


class EscrowContractBase(BaseModel):
    client: str
    freelancer: str
    milestone_descriptions: List[str]
    milestone_amounts: List[int]


class EscrowContractCreate(BaseModel):
    """Schema for creating escrow contract records after blockchain deployment."""
    project_id: UUID
    client_id: UUID
    freelancer_id: UUID
    total_amount: Decimal
    payment_mode: Optional[str] = Field(default='native', description="'native' or 'token'")
    chain_id: Optional[int] = None
    token_address: Optional[str] = None


class EscrowContractUpdate(BaseModel):
    status: Optional[str] = None


class EscrowContractFilter(BaseModel):
    """Schema for filtering escrow contracts."""
    project_id: Optional[UUID] = None
    client_id: Optional[UUID] = None
    freelancer_id: Optional[UUID] = None
    chain_id: Optional[int] = None
    status: Optional[Union[str, List[str]]] = None
    payment_mode: Optional[str] = None


class EscrowContractResponse(BaseModel):
    """Enhanced response schema for escrow contracts."""
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
    """Paginated response for escrow contract listings."""
    contracts: List[EscrowContractResponse]
    total_count: int
    page: int
    page_size: int
    has_next: bool
    has_prev: bool


# Legacy schemas (kept for backward compatibility)
class EscrowContract(EscrowContractBase):
    contract_address: str
    status: str

    class Config:
        from_attributes = True


class EscrowCreate(BaseModel):
    project_id: str
    amount: float
    description: str


class EscrowResponse(BaseModel):
    id: str
    project_id: str
    amount: float
    description: str
    status: str