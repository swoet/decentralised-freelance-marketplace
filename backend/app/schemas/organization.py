from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime

class OrganizationBase(BaseModel):
    name: str
    owner_id: Optional[UUID] = None

class OrganizationCreate(OrganizationBase):
    pass

class OrganizationUpdate(BaseModel):
    name: Optional[str] = None

class Organization(OrganizationBase):
    id: UUID
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class OrganizationResponse(Organization):
    pass 