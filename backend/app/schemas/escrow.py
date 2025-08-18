"""Escrow contract schemas."""

from pydantic import BaseModel
from typing import List, Optional


class EscrowContractBase(BaseModel):
    client: str
    freelancer: str
    milestone_descriptions: List[str]
    milestone_amounts: List[int]


class EscrowContractCreate(EscrowContractBase):
    private_key: str


class EscrowContractUpdate(BaseModel):
    status: Optional[str] = None


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