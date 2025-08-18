from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime

class BidBase(BaseModel):
    project_id: UUID
    freelancer_id: UUID
    amount: float
    cover_letter: Optional[str] = None
    status: Optional[str] = None

class BidCreate(BidBase):
    pass

class BidUpdate(BaseModel):
    amount: Optional[float] = None
    cover_letter: Optional[str] = None
    status: Optional[str] = None

class Bid(BidBase):
    id: UUID
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class BidResponse(Bid):
    pass 